
import mariadb from 'mariadb';
import Error from './Error';
import InternalError from './internal-error';

/**
 * Makes sure to close the connection pool.
 */
process.on('exit', async () => {
    await DatabaseConnection.reset();
});

namespace DatabaseConnection {
    // todo make configurable
    const connectionInfo = {
        host: 'localhost',
        database: 'PoEManager-test-manual',
        user: 'localroot',
        password: undefined
    };

    /**
     * The connection pool, or ```null``` if the pool was not initialized yet.
     */
    let pool: mariadb.Pool | null = null;

    /**
     * Initializes the pool connection.
     */
    function initialize(): void {
        pool = mariadb.createPool({
            host: connectionInfo.host,
            database: connectionInfo.database,
            user: connectionInfo.user,
            password: connectionInfo.password,
            multipleStatements: true,
            connectionLimit: 10
        });
    }

    /**
     * Resets the connection pool. After this, the pool needs to be re-initialized.
     */
    export async function reset(): Promise<void> {
        if (pool) {
            await pool.end();
            pool = null;
        }
    }

    /**
     * Returns a new database connection. If necessary, initializes the connection pool (required when the function is
     * called for the first time, or the first time after reset() has been called).
     *
     * @returns A new database connection.
     */
    async function getConnection(): Promise<mariadb.Connection> {
        if (!pool) {
            initialize();
        }

        // never null; was initialized before
        return (pool as mariadb.Pool).getConnection();
    }

    /**
     * Used to match SQL error codes to a throwable error.
     */
    export interface IErrorMatcher {
        code: number;
        error: Error;
    }

    /**
     * Additional data that can be passed to a SQL query.
     */
    export interface IAdditionQueryData {
        /**
         * SLQ parameters (parameters that can be bound to question marks in SQL).
         */
        parameters?: any[];

        /**
         * A list of error matchers for expected errors.
         *
         * This is used to automate error handling by transforming SQL errors into errors that will be thrown.
         * If an error is encountered that is not declared in this array, DatabaseConnection.UnexpectedSQLError will be
         * thrown.
         *
         * For example, if the following errors are declared:
         * ```typescript
         * {
         *     parameters: [...],
         *     expectedErrors: [
         *         {
         *             code: 1062,
         *             error: new MyError1();
         *         },
         *         {
         *             code: 1063,
         *             error: new MyError2();
         *         }
         *     ]
         * }
         * ```
         * The following SQL errors will result in these errors being thrown:
         * - 1062 -> MyError1
         * - 1063 -> MyError2
         * - any other error code -> DatabaseConnection.UnexpectedSQLError
         */
        expectedErrors?: IErrorMatcher[];
    }

    /**
     * Executes a single SQL query.
     *
     * @param sql The SQL statement.
     * @param additional Additional data that is required for the execution of the query.
     */
    export async function query(sql: string, additional?: IAdditionQueryData): Promise<any> {
        let conn: mariadb.Connection | null = null;

        try {
            conn = await getConnection();
            const connectionWrapper = new Connection(conn);
            const ret = await connectionWrapper.query(sql, additional);
            await conn.end();
            return ret;
        } catch (error) {
            if (conn) {
                await conn.end();
            }

            throw error;
        }
    }

    /**
     * Executes multiple SQL queries.
     *
     * @param queries A function that is supposed to contain a list of query statements:
     * ```
     * conn.query(<first SQL query>);
     * conn.query(<second SQL query>);
     * ```
     */
    export async function multiQuery<T>(queries: (conn: Connection) => Promise<T>): Promise<T> {
        let conn: mariadb.Connection | null = null;

        try {
            conn = await getConnection();
            const connectionWrapper = new Connection(conn);
            const ret = await queries(connectionWrapper);
            await conn.end();
            return ret;
        } catch (error) {
            if (conn) {
                await conn.end();
            }

            throw error;
        }
    }

    /**
     * Helper class that is used to wrap mariadb.Connection.
     *
     * This class only exposes the query() method, and it is used to be passed in DatabaseConnection.transaction().
     * It is also used by DatabaseConnection.query() to avoid code duplication.
     */
    export class Connection {
        private readonly connection: mariadb.Connection;

        /**
         * @param connection The database connection.
         */
        public constructor(connection: mariadb.Connection) {
            this.connection = connection;
        }

        /**
         * Executes a query in the same way that DatabaseConnection.query() does.
         *
         * @param sql The SQL statement.
         * @param additional Additional data that is required for the execution of the query.
         */
        public async query(sql: string, additional?: IAdditionQueryData): Promise<any> {
            try {
                const result = await this.connection.query(sql,
                    // pass parameters if there are any
                    additional && additional.parameters ? additional.parameters : undefined);
                return result;
            } catch (error) {
                if (additional && additional.expectedErrors) { // are there any matchers?

                    // find a matcher with for the error
                    const matcher = additional.expectedErrors.find(e => {
                        return e.code === error.errno;
                    });

                    // if a matcher was found, throw the error
                    if (matcher) {
                        throw matcher.error;
                    }
                }

                // if no error was thrown by now, the error is an unexpected one
                throw new UnexpectedSQLError(error.errno, error.code, error.message);
            }
        }
    }

    /**
     * Executes a series of SQL statements as a transaction.
     *
     * @param queries A function that is supposed to contain a list of query statements:
     * ```
     * conn.query(<first SQL query>);
     * conn.query(<second SQL query>);
     * ```
     */
    export async function transaction(queries: (conn: Connection) => Promise<void>) {
        let conn: mariadb.Connection | null = null;
        let requiresRollback = false;

        try {
            conn = await getConnection();
            const connectionWrapper = new Connection(conn);

            await conn.beginTransaction();
            requiresRollback = true;
            await queries(connectionWrapper);
            await conn.commit();

        } catch (error) {
            if (conn && requiresRollback) {
                await conn.rollback();
            }

            throw error;
        } finally {
            if (conn) {
                await conn.end();
            }
        }
    }

    /**
     * An enumeration of common MySQL / MariaDB error codes.
     */
    export enum ErrorCodes {
        CONSTRAINT_FAIL = 4025,
        DUPLICATE_ENTRY = 1062,
        DATA_TOO_LONG = 1406
    }

    /**
     * An error that will be thrown when an unexpected SQL error is encountered.
     */
    export class UnexpectedSQLError extends InternalError {
        public constructor(errorCode: number, error: string, message: string) {
            super({
                errorCode,
                error,
                message
            });
        }
    }
}

export = DatabaseConnection;
