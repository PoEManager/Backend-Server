import _ from 'lodash';
import DatabaseConnection from '../core/database-connection';
import errors from './errors';

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
            await this.query([]); // throws if the wallet restrictions was not found
            return;
        }

        const processedColumns = _.map(columns, (c, i) => `\`WalletRestrictions\`.\`${c}\`= ?`);

        const sql = `UPDATE \`WalletRestrictions\` SET ${processedColumns.join(', ')} WHERE ` +
            `\`WalletRestrictions\`.\`wallet_restriction_id\` = ?`;

        const result = await DatabaseConnection.query(sql, {
            parameters: [...walletRestrictionDataToValueList(restrictionData), this.id]
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
        /* istanbul ignore next */
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

    if (walletRestrictionData.ignoreAlt !== undefined) {
        ret.push('ignore_alt');
    }

    if (walletRestrictionData.ignoreFuse !== undefined) {
        ret.push('ignore_fuse');
    }

    if (walletRestrictionData.ignoreAlch !== undefined) {
        ret.push('ignore_alch');
    }

    if (walletRestrictionData.ignoreChaos !== undefined) {
        ret.push('ignore_chaos');
    }

    if (walletRestrictionData.ignoreGcp !== undefined) {
        ret.push('ignore_gcp');
    }

    if (walletRestrictionData.ignoreExa !== undefined) {
        ret.push('ignore_exa');
    }

    if (walletRestrictionData.ignoreChrom !== undefined) {
        ret.push('ignore_chrom');
    }

    if (walletRestrictionData.ignoreJew !== undefined) {
        ret.push('ignore_jew');
    }

    if (walletRestrictionData.ignoreChance !== undefined) {
        ret.push('ignore_chance');
    }

    if (walletRestrictionData.ignoreChisel !== undefined) {
        ret.push('ignore_chisel');
    }

    if (walletRestrictionData.ignoreScour !== undefined) {
        ret.push('ignore_scour');
    }

    if (walletRestrictionData.ignoreBlessed !== undefined) {
        ret.push('ignore_blessed');
    }

    if (walletRestrictionData.ignoreRegret !== undefined) {
        ret.push('ignore_regret');
    }

    if (walletRestrictionData.ignoreRegal !== undefined) {
        ret.push('ignore_regal');
    }

    if (walletRestrictionData.ignoreDivine !== undefined) {
        ret.push('ignore_divine');
    }

    if (walletRestrictionData.ignoreVaal !== undefined) {
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

    if (walletRestrictionData.ignoreAlt !== undefined) {
        ret.push(walletRestrictionData.ignoreAlt);
    }

    if (walletRestrictionData.ignoreFuse !== undefined) {
        ret.push(walletRestrictionData.ignoreFuse);
    }

    if (walletRestrictionData.ignoreAlch !== undefined) {
        ret.push(walletRestrictionData.ignoreAlch);
    }

    if (walletRestrictionData.ignoreChaos !== undefined) {
        ret.push(walletRestrictionData.ignoreChaos);
    }

    if (walletRestrictionData.ignoreGcp !== undefined) {
        ret.push(walletRestrictionData.ignoreGcp);
    }

    if (walletRestrictionData.ignoreExa !== undefined) {
        ret.push(walletRestrictionData.ignoreExa);
    }

    if (walletRestrictionData.ignoreChrom !== undefined) {
        ret.push(walletRestrictionData.ignoreChrom);
    }

    if (walletRestrictionData.ignoreJew !== undefined) {
        ret.push(walletRestrictionData.ignoreJew);
    }

    if (walletRestrictionData.ignoreChance !== undefined) {
        ret.push(walletRestrictionData.ignoreChance);
    }

    if (walletRestrictionData.ignoreChisel !== undefined) {
        ret.push(walletRestrictionData.ignoreChisel);
    }

    if (walletRestrictionData.ignoreScour !== undefined) {
        ret.push(walletRestrictionData.ignoreScour);
    }

    if (walletRestrictionData.ignoreBlessed !== undefined) {
        ret.push(walletRestrictionData.ignoreBlessed);
    }

    if (walletRestrictionData.ignoreRegret !== undefined) {
        ret.push(walletRestrictionData.ignoreRegret);
    }

    if (walletRestrictionData.ignoreRegal !== undefined) {
        ret.push(walletRestrictionData.ignoreRegal);
    }

    if (walletRestrictionData.ignoreDivine !== undefined) {
        ret.push(walletRestrictionData.ignoreDivine);
    }

    if (walletRestrictionData.ignoreVaal !== undefined) {
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
        id: result.wallet_restriction_id,
        ignoreAlt: result.ignore_alt,
        ignoreFuse: result.ignore_fuse,
        ignoreAlch: result.ignore_alch,
        ignoreChaos: result.ignore_chaos,
        ignoreGcp: result.ignore_gcp,
        ignoreExa: result.ignore_exa,
        ignoreChrom: result.ignore_chrom,
        ignoreJew: result.ignore_jew,
        ignoreChance: result.ignore_chance,
        ignoreChisel: result.ignore_chisel,
        ignoreScour: result.ignore_scour,
        ignoreBlessed: result.ignore_blessed,
        ignoreRegret: result.ignore_regret,
        ignoreRegal: result.ignore_regal,
        ignoreDivine: result.ignore_divine,
        ignoreVaal: result.ignore_vaal
    };
}

/* istanbul ignore next ; weird typescript behavior, the namespace will be turned into an (uncovered) branch*/
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
         * Query the amount of ignored Orb of Alteration.
         */
        IGNORE_ALT,

        /**
         * Query the amount of ignored Orb of Fusing.
         */
        IGNORE_FUSE,

        /**
         * Query the amount of ignored Orb of Alchemy.
         */
        IGNORE_ALCH,

        /**
         * Query the amount of ignored Chaos Orbs.
         */
        IGNORE_CHAOS,

        /**
         * Query the amount of ignored Gemcutters Prisms.
         */
        IGNORE_GCP,

        /**
         * Query the amount of ignored Exalted Orbs.
         */
        IGNORE_EXA,

        /**
         * Query the amount of ignored Chromatic Orbs.
         */
        IGNORE_CHROM,

        /**
         * Query the amount of ignored Jeweller's Orbs.
         */
        IGNORE_JEW,

        /**
         * Query the amount of ignored Orb of Chance.
         */
        IGNORE_CHANCE,

        /**
         * Query the amount of ignored Cartographer's Chisel.
         */
        IGNORE_CHISEL,

        /**
         * Query the amount of ignored Orb of Scouring.
         */
        IGNORE_SCOUR,

        /**
         * Query the amount of ignored Blessed Orbs.
         */
        IGNORE_BLESSED,

        /**
         * Query the amount of ignored Orb of Regret.
         */
        IGNORE_REGRET,

        /**
         * Query the amount of ignored Regal Orbs.
         */
        IGNORE_REGAL,

        /**
         * Query the amount of ignored Divine Orbs.
         */
        IGNORE_DIVINE,

        /**
         * Query the amount of ignored Vaal Orbs.
         */
        IGNORE_VAAL
    }

    export interface IWalletRestrictionData {
        /**
         * The amount of ignored Orb of Alteration.
         */
        ignoreAlt?: number;

        /**
         * The amount of ignored Orb of Fusing.
         */
        ignoreFuse?: number;

        /**
         * The amount of ignored Orb of Alchemy.
         */
        ignoreAlch?: number;

        /**
         * The amount of ignored Chaos Orbs.
         */
        ignoreChaos?: number;

        /**
         * The amount of ignored Gemcutters Prisms.
         */
        ignoreGcp?: number;

        /**
         * The amount of ignored Exalted Orbs.
         */
        ignoreExa?: number;

        /**
         * The amount of ignored Chromatic Orbs.
         */
        ignoreChrom?: number;

        /**
         * The amount of ignored Orb of Fusing.
         */
        ignoreJew?: number;

        /**
         * The amount of ignored Orb of Chance.
         */
        ignoreChance?: number;

        /**
         * The amount of ignored Cartographer's Chisel.
         */
        ignoreChisel?: number;

        /**
         * The amount of ignored Orb of Scouring.
         */
        ignoreScour?: number;

        /**
         * The amount of ignored Blessed Orbs.
         */
        ignoreBlessed?: number;

        /**
         * The amount of ignored Orb of Regret.
         */
        ignoreRegret?: number;

        /**
         * The amount of ignored Regal Orbs.
         */
        ignoreRegal?: number;

        /**
         * The amount of ignored Divine Orbs.
         */
        ignoreDivine?: number;

        /**
         * The amount of ignored Vaal Orbs.
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
