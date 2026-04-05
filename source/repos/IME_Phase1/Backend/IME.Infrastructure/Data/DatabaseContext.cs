using System.Data;
using System.Data.SqlClient;

namespace IME.Infrastructure.Data;

public class DatabaseContext
{
    private readonly string _connectionString;

    public DatabaseContext(string connectionString)
    {
        _connectionString = connectionString;
    }

    public SqlConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }

    public async Task<SqlConnection> CreateOpenConnectionAsync()
    {
        var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();
        return connection;
    }

    public SqlCommand CreateCommand(string query, SqlConnection connection)
    {
        return new SqlCommand(query, connection);
    }

    public SqlCommand CreateStoredProcCommand(string procedureName, SqlConnection connection)
    {
        return new SqlCommand(procedureName, connection)
        {
            CommandType = CommandType.StoredProcedure
        };
    }
}
