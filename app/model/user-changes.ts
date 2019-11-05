
import DatabaseConnection from '../core/database-connection';
import errors from './errors';
import User from './user';
import UserManager from './user-manager';

/*
IMPORTANT:
Places marked with <add here> need to be expanded when adding new change states
*/

namespace UserChanges {
    /**
     * @param id The user ID.
     * // @param conn A connection that can be used for the queries. If not passed, a new transaction will be created.
     *
     * @returns The current change state of the user, or `null` if no change is currently going on.
     */
    // version with connection as parameter is currently not in use
    export async function getChangeState(id: User.ID /*, conn?: DatabaseConnection.Connection*/ ):
        Promise<ChangeType | null> {

        const handler = async (innerConn: DatabaseConnection.Connection) => {
            const state = await _getChangeState(innerConn, id);

            if (await isChangeInProgress(innerConn, id)) {
                return state;
            } else {
                if (state !== null) {
                    await resetChange(innerConn, id, state);
                }

                return null;
            }
        };

        /* if (conn) {
            return await handler(conn);
        } else { */
        return await DatabaseConnection.transaction(handler);
        /* } */
    }

    /**
     * @param conn The connection that will be used for the query.
     * @param id The user ID.
     *
     * @returns `true`, if there is a change in progress, `false` if not.
     */
    async function isChangeInProgress(conn: DatabaseConnection.Connection, id: User.ID): Promise<boolean> {
        const result = await conn.query(
            'SELECT (`change_uid` = NULL OR `change_expire_date` < ?) as is_expired ' +
            'FROM `Users` WHERE `Users`.`user_id` = ?', {
            parameters: [
                new Date(),
                id
            ]
        });

        if (result.length !== 1) {
            throw new errors.UserNotFoundError(id);
        }

        if (result[0].is_expired) {
            return false;
        }

        return true;
    }

    /**
     * Resets an ongoing change (in a ROLLBACK sort of way).
     *
     * @param conn The connection that will be used for the query.
     * @param id The user ID.
     * @param change The change to reset.
     */
    async function resetChange(conn: DatabaseConnection.Connection, id: User.ID, change: ChangeType): Promise<void> {
        await resetChangeMeta(conn, id);

        // <add here> add new cases
        switch (change) {
            case ChangeType.VERIFY_ACCOUNT:
                // verification needs no reset
                break;
            case ChangeType.NEW_EMAIL:
                await conn.query(
                    'UPDATE `DefaultLogins` SET `new_email` = null WHERE `DefaultLogins`.`defaultlogin_id` = ' +
                    '(SELECT `Users`.`defaultlogin_id` FROM `Users` WHERE `Users`.`user_id` = ?)', {

                    parameters: [
                        id
                    ]
                });
                break;
            case ChangeType.NEW_PASSWORD:
                await conn.query(
                    'UPDATE `DefaultLogins` SET `new_password` = null WHERE `DefaultLogins`.`defaultlogin_id` = ' +
                    '(SELECT `Users`.`defaultlogin_id` FROM `Users` WHERE `Users`.`user_id` = ?)', {

                    parameters: [
                        id
                    ]
                });
                break;
        }
    }

    /**
     * Resets the change UID and expire date.
     *
     * @param conn The connection that will be used for the query.
     * @param id The user ID.
     */
    async function resetChangeMeta(conn: DatabaseConnection.Connection, id: User.ID): Promise<void> {
        const result = await conn.query(
            'UPDATE `Users` SET `change_uid` = NULL, `change_expire_date` = NULL WHERE `Users`.`user_id` = ?', {
            parameters: [
                id
            ]
        });

        if (result.affectedRows !== 1) {
            throw new errors.UserNotFoundError(id);
        }
    }

    /**
     * Queries the current change state.
     * This method ignores the change_uid and change_expire_date.
     *
     * @param conn The connection that will be used for the query.
     * @param id The user ID.
     */
    async function _getChangeState(conn: DatabaseConnection.Connection, id: User.ID): Promise<ChangeType | null> {
        const result = await conn.query(
            'SELECT `Users`.`verified`, `DefaultLogins`.`new_email`, `DefaultLogins`.`new_password` ' +
            'FROM `Users` LEFT JOIN `DefaultLogins` ON ' +
                '(`DefaultLogins`.`defaultlogin_id` = `Users`.`defaultlogin_id`) ' +
            'WHERE `Users`.`user_id` = ?', {
            parameters: [
                id
            ]
        });

        if (result.length !== 1) {
            throw new errors.UserNotFoundError(id);
        }

        // <add here> add new conditions
        if (!result[0].verified) { // if the user is not verified yet, this change takes precedence
            return ChangeType.VERIFY_ACCOUNT;
        } else if (result[0].new_email) {
            return ChangeType.NEW_EMAIL;
        } else if (result[0].new_password) {
            return ChangeType.NEW_PASSWORD;
        } else {
            return null;
        }
    }

    /**
     * Creates a new change for the user by setting a change uid and change expire date.
     *
     * @param id The user ID.
     * @param infiniteDuration If ```true```, the change will never expire. Otherwise, it expires after two weeks.
     *
     * @throws **ChangeAlreadyInProgressError** If there is already another change in progress.
     * @throws **UserNotFoundError** If the user does not exist.
     */
    export async function newChange(id: User.ID, infiniteDuration: boolean): Promise<UserManager.ChangeID> {
        if (await getChangeState(id) !== null) { // also throws user not found error
            throw new errors.ChangeAlreadyInProgressError(id);
        }
        const dateFn = infiniteDuration ? 'POEM_DATE_INFINITY()' : 'POEM_DATE_TWO_WEEKS()';

        const result = await DatabaseConnection.query(`UPDATE \`Users\` ` +
            `SET \`Users\`.\`change_uid\` = POEM_UUID(), \`Users\`.\`change_expire_date\` = ${dateFn}` +
            `WHERE \`Users\`.\`user_id\` = ?;` +
            `SELECT TO_BASE64(\`Users\`.\`change_uid\`) AS change_uid FROM \`Users\` ` +
            `WHERE \`Users\`.\`user_id\` = ?;`, {
                parameters: [
                    id,
                    id
                ]
            });

        if (result[0].affectedRows !== 1 || result[1].length !== 1) {
            throw new errors.UserNotFoundError(id);
        }

        return result[1][0].change_uid;
    }

    /**
     * Validates the a change with the passed , if one is going on.
     *
     * @param changeId The ID of the change that should be verified.
     *
     * @throws **InvalidChangeIDError** If the passed ID is invalid.
     */
    export async function validateChange(changeId: UserManager.ChangeID): Promise<void> {
        await DatabaseConnection.transaction(async conn => {
            let result = await conn.query(
                'SELECT `Users`.`user_id` FROM `Users` WHERE `change_uid` = FROM_BASE64(?)', {
                parameters: [
                    changeId
                ]
            });

            if (result.length !== 1) {
                throw new errors.InvalidChangeIDError(changeId);
            }

            const id = result[0].user_id;
            const changeType = await getChangeState(id);

            // <add here> new handler
            switch (changeType) {
                case ChangeType.VERIFY_ACCOUNT:
                    await validateValidationChange(id, conn);
                    break;
                case ChangeType.NEW_EMAIL:
                    await validateNewEmailChange(id, conn);
                    break;
                case ChangeType.NEW_PASSWORD:
                    await validateNewPasswordChange(id, conn);
                    break;
            }

            result = await conn.query('UPDATE `Users` SET `Users`.`change_uid`= NULL, ' +
                '`Users`.`change_expire_date` = NULL WHERE `Users`.`user_id` = ?', {

                parameters: [
                    id
                ]
            });
        });
    }

    /**
     * Verifies an account.
     *
     * @param id The ID of the user.
     * @param conn The connection that will be used for the queries.
     */
    async function validateValidationChange(id: User.ID, conn: DatabaseConnection.Connection): Promise <void> {
        const result = await conn.query('UPDATE `Users` SET `verified`= true WHERE `Users`.`user_id` = ?', {
            parameters: [
                id
            ]
        });

        if (result.affectedRows !== 1) {
            throw new errors.UserNotFoundError(id);
        }
    }

    /**
     * Writes new_email into email.
     *
     * @param id The ID of the user.
     * @param conn The connection that will be used for the queries.
     */
    async function validateNewEmailChange(id: User.ID, conn: DatabaseConnection.Connection): Promise <void> {
        const result = await conn.query(
            'UPDATE `DefaultLogins` SET `email`= `new_email`, `new_email` = NULL ' +
            ' WHERE `DefaultLogins`.`defaultlogin_id` = ' +
            '(SELECT `Users`.`defaultlogin_id` FROM `Users` WHERE `Users`.`user_id` = ?)', {

            parameters: [
                id
            ]
        });

        if (result.affectedRows !== 1) {
            throw new errors.UserNotFoundError(id);
        }
    }

    /**
     * Writes new_password into password.
     *
     * @param id The ID of the user.
     * @param conn The connection that will be used for the queries.
     */
    async function validateNewPasswordChange(id: User.ID, conn: DatabaseConnection.Connection): Promise <void> {
        const result = await conn.query(
            'UPDATE `DefaultLogins` SET `password`= `new_password`, `new_password` = NULL ' +
            ' WHERE `DefaultLogins`.`defaultlogin_id` = ' +
            '(SELECT `Users`.`defaultlogin_id` FROM `Users` WHERE `Users`.`user_id` = ?)', {

            parameters: [
                id
            ]
        });

        if (result.affectedRows !== 1) {
            throw new errors.UserNotFoundError(id);
        }
    }

    export async function getUserFromChangeId(changeId: UserManager.ChangeID): Promise<User.ID> {
        const result = await DatabaseConnection.query(
            'SELECT `Users`.`user_id` FROM `Users` WHERE `Users`.`change_uid` = FROM_BASE64(?)', {
                parameters: [
                    changeId
                ]
            });

        if (result.length !== 1) {
            throw new errors.InvalidChangeIDError(changeId);
        }

        return result[0].user_id;
    }

    // <add here> new literals
    /**
     * An enum with the possible types of account changes.
     */
    export enum ChangeType {
        /**
         * The account requires verification.
         */
        VERIFY_ACCOUNT,
        /**
         * The E-Mail is being changed.
         */
        NEW_EMAIL,
        /**
         * The password is being changed.
         */
        NEW_PASSWORD
    }
}

export = UserChanges;
