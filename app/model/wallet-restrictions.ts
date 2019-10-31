import _ from 'lodash';
import DatabaseConnection from '../core/database-connection';
import errors from './errors';
import Password from './password';
import User from './user';
import UserChanges from './user-changes';
import UserManager from './user-manager';

/**
 * The representation of a single user login.
 *
 * In order to get such a reference, see UserManager.getDefaultLogin() or User.getDefaultLogin().
 */
class WalletRestrictions {
    /**
     * The ID of the login.
     */
    private readonly id: number;

    /**
     * Constructs a new instance. Should not be used directly, use UserManager.getDefaultLogin() instead.
     *
     * @param id The ID of the login.
     */
    public constructor(id: WalletRestrictions.ID) {
        this.id = id;
    }

    /**
     * @returns The ID of the login.
     */
    public getId(): WalletRestrictions.ID {
        return this.id;
    }

    /**
     * @param queryData The currency item to query the restricted amount of.
     * @returns The restricted amount of a certain currency item.
     *
     * @throws **WalletRestrictionNotFoundError** If the wallet restriction does not exist.
     */
    public async getRestriction(queryData: WalletRestrictions.QueryData): Promise<number> {
        const result = await DatabaseConnection.query(
            `SELECT \`${queryDataToColumn(queryData)}\` AS restriction FROM \`WalletRestrictions\` ` +
            `WHERE \`WalletRestrictions\`.\`wallet_restriction_id\` = ?`, {
                parameters: [
                    this.id
                ]
            });

        if (result.length === 1) {
            return result[0].restriction;
        } else {
            throw this.makeWalletRestrictionNotFoundError();
        }
    }

    /**
     * @param queryData The currency item to query the restricted amount of.
     * @returns The restricted amount of a certain currency item.
     *
     * @throws **WalletRestrictionNotFoundError** If the wallet restriction does not exist.
     */
    public async setRestriction(queryData: WalletRestrictions.QueryData, value: number): Promise<void> {
        const result = await DatabaseConnection.query(
            `UPDATE \`WalletRestrictions\` SET \`${queryDataToColumn(queryData)}\` = ? ` +
            `WHERE \`WalletRestrictions\`.\`wallet_restriction_id\` = ?`, {
                parameters: [
                    value,
                    this.id
                ]
            });

        if (result.affectedRows === 0) {
            throw this.makeWalletRestrictionNotFoundError();
        }
    }

    /**
     * Query data about the login. This method unites all of the other getters (such as getEmail() and getPassword())
     * into one. This can improve the performance, because it reduces the amount of SQL calls to the database.
     *
     * @param queryData A list of the data that should be queried.
     * @returns The queried data.
     */
    public async query(queryData: WalletRestrictions.QueryData[]): Promise<WalletRestrictions.IQueryResult> {
        let columns: string;

        // if no data is queried, just check if the wallet restriction exists (if not, an error will be thrown)
        if (queryData.length === 0) {
            columns = '1';
        } else {
            let columnsList  = _.map(queryData, queryDataToColumn); // convert QueryData to actual SQL columns
            columnsList = _.map(columnsList, str => `\`${str}\``); // surround columns with backticks (`)
            columns = columnsList.join(','); // make comma separated list
        }
        const sql = `SELECT ${columns} FROM \`WalletRestrictions\` WHERE ` +
            `\`WalletRestrictions\`.\`wallet_restriction_id\` = ?`;

        const result = await DatabaseConnection.query(sql, {
            parameters: [
                this.id
            ]
        });

        if (result.length === 1) {
            return sqlResultToQueryResult(result[0], queryData);
        } else {
            throw this.makeWalletRestrictionNotFoundError();
        }
    }

    public async update(restrictionData: WalletRestrictions.IWalletRestrictionData) {
        const columns = walletRestrictionDataToColumnList(restrictionData);

        if (columns.length === 0) { // no columns to update; no need to continue
            return;
        }

        const processedColumns = _.map(columns, (c, i) => `\`WalletRestrictions\`.\`${c}\`= ?`);

        const sql = `UPDATE \`WalletRestrictions\` SET ${processedColumns.join(', ')}`;

        const result = await DatabaseConnection.query(sql, {
            parameters: walletRestrictionDataToValueList(restrictionData)
        });

        if (result.affectedRows === 0) {
            throw this.makeWalletRestrictionNotFoundError();
        }
    }

    /**
     * @returns A WalletRestrictionNotFoundError with the proper ID.
     */
    private makeWalletRestrictionNotFoundError(): errors.WalletRestrictionsNotFoundError {
        return new errors.WalletRestrictionsNotFoundError(this.id);
    }

    /*
    ============================================
    UNUSED FOR NOW
    May be required in the future.
    ============================================
    /**
     * Queries the ID of the user, that the wallet restriction belongs to.
     *
     * @param conn The connection that will be used for the query. When not passed, a new connection will be created.
     *\/
    private async getUserId(conn?: DatabaseConnection.Connection): Promise<User.ID> {
        const handler = async (innerConn: DatabaseConnection.Connection): Promise<User.ID> =>  {
            // get user ID of the login
            const result = await innerConn.query(
                'SELECT `Users`.`user_id` FROM `Users` NATURAL JOIN `WalletRestrictions` ' +
                'WHERE `WalletRestrictions`.`wallet_restriction_id` = ?', {
                    parameters: [
                        this.id
                    ]
                });

            // should not happen; there is never a default login without a user that it belongs to
            if (result.length === 0) {
                throw new errors.UserNotFoundError(-1);
            }

            return result[0].user_id;
        };

        if (conn) {
            return await handler(conn);
        } else {
            return await DatabaseConnection.multiQuery(handler);
        }
    } */
}

/**
 * Maps the elements in User.QueryData to their SQL column counterparts.
 *
 * @param queryData The data to map.
 * @returns The SQL column.
 */
function queryDataToColumn(queryData: WalletRestrictions.QueryData): string {
    switch (queryData) {
        case WalletRestrictions.QueryData.ID:
            return 'wallet_restriction_id';
        case WalletRestrictions.QueryData.IGNORE_ALT:
            return 'ignore_alt';
        case WalletRestrictions.QueryData.IGNORE_FUSE:
            return 'ignore_fuse';
        case WalletRestrictions.QueryData.IGNORE_ALCH:
            return 'ignore_alch';
        case WalletRestrictions.QueryData.IGNORE_CHAOS:
            return 'ignore_chaos';
        case WalletRestrictions.QueryData.IGNORE_GCP:
            return 'ignore_gcp';
        case WalletRestrictions.QueryData.IGNORE_EXA:
            return 'ignore_exa';
        case WalletRestrictions.QueryData.IGNORE_CHROM:
            return 'ignore_chrom';
        case WalletRestrictions.QueryData.IGNORE_JEW:
            return 'ignore_jew';
        case WalletRestrictions.QueryData.IGNORE_CHANCE:
            return 'ignore_chance';
        case WalletRestrictions.QueryData.IGNORE_CHISEL:
            return 'ignore_chisel';
        case WalletRestrictions.QueryData.IGNORE_SCOUR:
            return 'ignore_scour';
        case WalletRestrictions.QueryData.IGNORE_BLESSED:
            return 'ignore_blessed';
        case WalletRestrictions.QueryData.IGNORE_REGRET:
            return 'ignore_regret';
        case WalletRestrictions.QueryData.IGNORE_REGAL:
            return 'ignore_regal';
        case WalletRestrictions.QueryData.IGNORE_DIVINE:
            return 'ignore_divine';
        case WalletRestrictions.QueryData.IGNORE_VAAL:
            return 'ignore_vaal';
        default:
            return ''; // does not happen
    }
}

/**
 * Depending on the presence of their respective keys in the passed object, returns the column names of currency items.
 *
 * @param walletRestrictionData The wallet restriction data to get the columns for.
 *
 * @returns The columns.
 */
function walletRestrictionDataToColumnList(walletRestrictionData: WalletRestrictions.IWalletRestrictionData): string[] {
    const ret: string[] = [];

    if (walletRestrictionData.ignoreAlt) {
        ret.push('ignore_alt');
    }

    if (walletRestrictionData.ignoreFuse) {
        ret.push('ignore_fuse');
    }

    if (walletRestrictionData.ignoreAlch) {
        ret.push('ignore_alch');
    }

    if (walletRestrictionData.ignoreChaos) {
        ret.push('ignore_chaos');
    }

    if (walletRestrictionData.ignoreGcp) {
        ret.push('ignore_gcp');
    }

    if (walletRestrictionData.ignoreExa) {
        ret.push('ignore_exa');
    }

    if (walletRestrictionData.ignoreChrom) {
        ret.push('ignore_chrom');
    }

    if (walletRestrictionData.ignoreJew) {
        ret.push('ignore_jew');
    }

    if (walletRestrictionData.ignoreChance) {
        ret.push('ignore_chance');
    }

    if (walletRestrictionData.ignoreChisel) {
        ret.push('ignore_chisel');
    }

    if (walletRestrictionData.ignoreScour) {
        ret.push('ignore_scour');
    }

    if (walletRestrictionData.ignoreBlessed) {
        ret.push('ignore_blessed');
    }

    if (walletRestrictionData.ignoreRegret) {
        ret.push('ignore_regret');
    }

    if (walletRestrictionData.ignoreRegal) {
        ret.push('ignore_regal');
    }

    if (walletRestrictionData.ignoreDivine) {
        ret.push('ignore_divine');
    }

    if (walletRestrictionData.ignoreVaal) {
        ret.push('ignore_vaal');
    }

    return ret;
}

/**
 * Depending on the presence of their respective keys in the passed object, returns the column names of currency items.
 *
 * @param walletRestrictionData The wallet restriction data to get the columns for.
 *
 * @returns The columns.
 */
function walletRestrictionDataToValueList(walletRestrictionData: WalletRestrictions.IWalletRestrictionData): number[] {
    // IMPORTANT: the order of the properties needs to be the same as it is in walletRestrictionDataToColumnList()

    const ret: number[] = [];

    if (walletRestrictionData.ignoreAlt) {
        ret.push(walletRestrictionData.ignoreAlt);
    }

    if (walletRestrictionData.ignoreFuse) {
        ret.push(walletRestrictionData.ignoreFuse);
    }

    if (walletRestrictionData.ignoreAlch) {
        ret.push(walletRestrictionData.ignoreAlch);
    }

    if (walletRestrictionData.ignoreChaos) {
        ret.push(walletRestrictionData.ignoreChaos);
    }

    if (walletRestrictionData.ignoreGcp) {
        ret.push(walletRestrictionData.ignoreGcp);
    }

    if (walletRestrictionData.ignoreExa) {
        ret.push(walletRestrictionData.ignoreExa);
    }

    if (walletRestrictionData.ignoreChrom) {
        ret.push(walletRestrictionData.ignoreChrom);
    }

    if (walletRestrictionData.ignoreJew) {
        ret.push(walletRestrictionData.ignoreJew);
    }

    if (walletRestrictionData.ignoreChance) {
        ret.push(walletRestrictionData.ignoreChance);
    }

    if (walletRestrictionData.ignoreChisel) {
        ret.push(walletRestrictionData.ignoreChisel);
    }

    if (walletRestrictionData.ignoreScour) {
        ret.push(walletRestrictionData.ignoreScour);
    }

    if (walletRestrictionData.ignoreBlessed) {
        ret.push(walletRestrictionData.ignoreBlessed);
    }

    if (walletRestrictionData.ignoreRegret) {
        ret.push(walletRestrictionData.ignoreRegret);
    }

    if (walletRestrictionData.ignoreRegal) {
        ret.push(walletRestrictionData.ignoreRegal);
    }

    if (walletRestrictionData.ignoreDivine) {
        ret.push(walletRestrictionData.ignoreDivine);
    }

    if (walletRestrictionData.ignoreVaal) {
        ret.push(walletRestrictionData.ignoreVaal);
    }

    return ret;
}

/**
 * Converts a SQL query result to User.IQueryResult.
 *
 * @param result The SQL query result.
 * @returns The converted result.
 */
function sqlResultToQueryResult(result: any, queryData: WalletRestrictions.QueryData[]):
    WalletRestrictions.IQueryResult {

    // alias name
    const QueryData = WalletRestrictions.QueryData;

    return {
        id: queryData.includes(QueryData.ID) ? result.wallet_restriction_id : undefined,
        ignoreAlt: queryData.includes(QueryData.IGNORE_ALT) ? result.ignore_alt : undefined,
        ignoreFuse: queryData.includes(QueryData.IGNORE_FUSE) ? result.ignore_fuse : undefined,
        ignoreAlch: queryData.includes(QueryData.IGNORE_ALCH) ? result.ignore_alch : undefined,
        ignoreChaos: queryData.includes(QueryData.IGNORE_CHAOS) ? result.ignore_chaos : undefined,
        ignoreGcp: queryData.includes(QueryData.IGNORE_GCP) ? result.ignore_gcp : undefined,
        ignoreExa: queryData.includes(QueryData.IGNORE_EXA) ? result.ignore_exa : undefined,
        ignoreChrom: queryData.includes(QueryData.IGNORE_CHROM) ? result.ignore_chrom : undefined,
        ignoreJew: queryData.includes(QueryData.IGNORE_JEW) ? result.ignore_jew : undefined,
        ignoreChance: queryData.includes(QueryData.IGNORE_CHANCE) ? result.ignore_chance : undefined,
        ignoreChisel: queryData.includes(QueryData.IGNORE_CHISEL) ? result.ignore_chisel : undefined,
        ignoreScour: queryData.includes(QueryData.IGNORE_SCOUR) ? result.ignore_scour : undefined,
        ignoreBlessed: queryData.includes(QueryData.IGNORE_BLESSED) ? result.ignore_blessed : undefined,
        ignoreRegret: queryData.includes(QueryData.IGNORE_REGRET) ? result.ignore_regret : undefined,
        ignoreRegal: queryData.includes(QueryData.IGNORE_REGAL) ? result.ignore_regal : undefined,
        ignoreDivine: queryData.includes(QueryData.IGNORE_DIVINE) ? result.ignore_divine : undefined,
        ignoreVaal: queryData.includes(QueryData.IGNORE_VAAL) ? result.ignore_vaal : undefined
    };
}

namespace WalletRestrictions {
    /**
     * The type of a login ID.
     */
    export type ID = number;

    /**
     * The data that can be queried by DefaultLogin.query().
     */
    export enum QueryData {
        /**
         * Query the ID of the login. Equivalent to User.getId().
         */
        ID,
        /**
         * Query the E-Mail of the login. Equivalent to User.getEmail().
         */
        IGNORE_ALT,
        /**
         * Query the password of the login. Equivalent to User.getPassword().
         */
        IGNORE_FUSE,
        /**
         * Query the new E-Mail of the login. Equivalent to User.getNewEmail().
         */
        IGNORE_ALCH,
        /**
         * Query the new password of the login. Equivalent to User.getNewPassword().
         */
        IGNORE_CHAOS,
        IGNORE_GCP,
        IGNORE_EXA,
        IGNORE_CHROM,
        IGNORE_JEW,
        IGNORE_CHANCE,
        IGNORE_CHISEL,
        IGNORE_SCOUR,
        IGNORE_BLESSED,
        IGNORE_REGRET,
        IGNORE_REGAL,
        IGNORE_DIVINE,
        IGNORE_VAAL
    }

    export interface IWalletRestrictionData {
        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreAlt?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreFuse?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreAlch?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreChaos?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreGcp?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreExa?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreChrom?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreJew?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreChance?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreChisel?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreScour?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreBlessed?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreRegret?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreRegal?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreDivine?: number;

        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreVaal?: number;
    }

    /**
     * The result of DefaultLogin.query().
     *
     * For data that was not queried, the fields will be ```undefined```.
     */
    export interface IQueryResult extends IWalletRestrictionData {
        /**
         * The ID of the login.
         */
        id?: ID;
    }
}

export = WalletRestrictions;
