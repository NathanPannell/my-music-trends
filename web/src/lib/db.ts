import sql from 'mssql';

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // Required for Azure
    trustServerCertificate: false, // Change to true for local dev / self-signed certs
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getPool() {
  if (pool) return pool;

  const connectionString = process.env.connection_string || process.env.CONNECTION_STRING;

  try {
    if (connectionString) {
      // Parse connection string explicitly to ensure correct config
      // @ts-ignore
      const parsed = await sql.ConnectionPool.parseConnectionString(connectionString);
      
      // Manually construct config to avoid issues with direct usage of parsed object
      const connectionConfig = {
        user: parsed.user,
        password: parsed.password,
        server: parsed.server,
        database: parsed.database,
        options: {
          encrypt: true, // Azure requires encryption
          trustServerCertificate: false,
        }
      };
      
      pool = await sql.connect(connectionConfig);
    } else {
      // Fallback to individual config if connection string is not provided
      pool = await sql.connect(config);
    }
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
}

export async function query(queryString: string, params: Record<string, any> = {}) {
  const pool = await getPool();
  const request = pool.request();

  Object.entries(params).forEach(([key, value]) => {
    request.input(key, value);
  });

  return request.query(queryString);
}
