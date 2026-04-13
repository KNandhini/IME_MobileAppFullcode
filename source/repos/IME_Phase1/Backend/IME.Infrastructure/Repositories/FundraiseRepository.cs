using System.Data;
using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Data;

namespace IME.Infrastructure.Repositories
{
    public class FundraiseRepository : IFundraiseRepository
    {
        private readonly DatabaseContext _dbContext;

        public FundraiseRepository(DatabaseContext dbContext)
        {
            _dbContext = dbContext;
        }

        // ✅ GET ALL
        public async Task<List<Fundraise>> GetAllFundraiseAsync()
        {
            var list = new List<Fundraise>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetAllFundraise", connection);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                list.Add(MapFundraise(reader));
            }

            return list;
        }

        // ✅ GET BY ID
        public async Task<Fundraise?> GetFundraiseByIdAsync(int id)
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetFundraiseById", connection);

            command.Parameters.AddWithValue("@Id", id);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return MapFundraise(reader);
            }

            return null;
        }

        // ✅ CREATE
        public async Task<int> CreateFundraiseAsync(Fundraise fundraise)
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_InsertFundraise", connection);

            command.Parameters.AddWithValue("@FullName", fundraise.FullName);
            command.Parameters.AddWithValue("@Age", fundraise.Age ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Gender", fundraise.Gender);
            command.Parameters.AddWithValue("@Place", fundraise.Place);
            command.Parameters.AddWithValue("@Address", fundraise.Address);
            command.Parameters.AddWithValue("@ContactNumber", fundraise.ContactNumber ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@RelationToCommunity", fundraise.RelationToCommunity);

            command.Parameters.AddWithValue("@FundTitle", fundraise.FundTitle);
            command.Parameters.AddWithValue("@FundCategory", fundraise.FundCategory);
            command.Parameters.AddWithValue("@Description", fundraise.Description);
            command.Parameters.AddWithValue("@TargetAmount", fundraise.TargetAmount);
            command.Parameters.AddWithValue("@CollectedAmount", fundraise.CollectedAmount);
            command.Parameters.AddWithValue("@UrgencyLevel", fundraise.UrgencyLevel);

            command.Parameters.AddWithValue("@StartDate", fundraise.StartDate);
            command.Parameters.AddWithValue("@EndDate", fundraise.EndDate);

            command.Parameters.AddWithValue("@SupportingDocumentUrl", fundraise.SupportingDocumentUrl ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@BeneficiaryPhotoUrl", fundraise.BeneficiaryPhotoUrl ?? (object)DBNull.Value);

            command.Parameters.AddWithValue("@AccountHolderName", fundraise.AccountHolderName);
            command.Parameters.AddWithValue("@BankAccountNumber", fundraise.BankAccountNumber);
            command.Parameters.AddWithValue("@IFSCCode", fundraise.IFSCCode);
            command.Parameters.AddWithValue("@UPIId", fundraise.UPIId ?? (object)DBNull.Value);

            command.Parameters.AddWithValue("@Status", fundraise.Status);
            command.Parameters.AddWithValue("@CreatedBy", fundraise.CreatedBy);
            command.Parameters.AddWithValue("@CreatedDate", fundraise.CreatedDate);
            command.Parameters.AddWithValue("@BalanceAmount", fundraise.BalanceAmount);
            command.Parameters.AddWithValue("@MinimumAmount", fundraise.MinimumAmount);


            var result = await command.ExecuteScalarAsync(); // SP should return Id
            return Convert.ToInt32(result);
        }

        // ✅ UPDATE
        public async Task<bool> UpdateFundraiseAsync(Fundraise fundraise)
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_UpdateFundraise", connection);

            command.Parameters.AddWithValue("@Id", fundraise.Id);

            command.Parameters.AddWithValue("@FullName", fundraise.FullName);
            command.Parameters.AddWithValue("@Age", fundraise.Age ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@Gender", fundraise.Gender);
            command.Parameters.AddWithValue("@Place", fundraise.Place);
            command.Parameters.AddWithValue("@Address", fundraise.Address);
            command.Parameters.AddWithValue("@ContactNumber", fundraise.ContactNumber ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@RelationToCommunity", fundraise.RelationToCommunity);

            command.Parameters.AddWithValue("@FundTitle", fundraise.FundTitle);
            command.Parameters.AddWithValue("@FundCategory", fundraise.FundCategory);
            command.Parameters.AddWithValue("@Description", fundraise.Description);
            command.Parameters.AddWithValue("@TargetAmount", fundraise.TargetAmount);
            command.Parameters.AddWithValue("@CollectedAmount", fundraise.CollectedAmount);
            command.Parameters.AddWithValue("@UrgencyLevel", fundraise.UrgencyLevel);

            command.Parameters.AddWithValue("@StartDate", fundraise.StartDate);
            command.Parameters.AddWithValue("@EndDate", fundraise.EndDate);

            command.Parameters.AddWithValue("@SupportingDocumentUrl", fundraise.SupportingDocumentUrl ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@BeneficiaryPhotoUrl", fundraise.BeneficiaryPhotoUrl ?? (object)DBNull.Value);

            command.Parameters.AddWithValue("@AccountHolderName", fundraise.AccountHolderName);
            command.Parameters.AddWithValue("@BankAccountNumber", fundraise.BankAccountNumber);
            command.Parameters.AddWithValue("@IFSCCode", fundraise.IFSCCode);
            command.Parameters.AddWithValue("@UPIId", fundraise.UPIId ?? (object)DBNull.Value);

            command.Parameters.AddWithValue("@Status", fundraise.Status);
            command.Parameters.AddWithValue("@ModifiedBy", fundraise.ModifiedBy ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@ModifiedDate", fundraise.ModifiedDate ?? (object)DBNull.Value);
            // command.Parameters.AddWithValue("@BalanceAmount", fundraise.BalanceAmount);
            command.Parameters.AddWithValue("@MinimumAmount", fundraise.MinimumAmount);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
            }

            return false;
        }

        // ✅ DELETE
        public async Task<bool> DeleteFundraiseAsync(int id)
        {
            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_DeleteFundraise", connection);

            command.Parameters.AddWithValue("@Id", id);

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;
            }

            return false;
        }

        // 🔥 COMMON MAPPING METHOD
        private Fundraise MapFundraise(IDataReader reader)
        {
            return new Fundraise
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                FullName = reader.GetString(reader.GetOrdinal("FullName")),
                Age = reader.IsDBNull(reader.GetOrdinal("Age")) ? null : reader.GetInt32(reader.GetOrdinal("Age")),
                Gender = reader.GetString(reader.GetOrdinal("Gender")),
                Place = reader.GetString(reader.GetOrdinal("Place")),
                Address = reader.GetString(reader.GetOrdinal("Address")),
                ContactNumber = reader.IsDBNull(reader.GetOrdinal("ContactNumber")) ? null : reader.GetString(reader.GetOrdinal("ContactNumber")),
                RelationToCommunity = reader.GetString(reader.GetOrdinal("RelationToCommunity")),

                FundTitle = reader.GetString(reader.GetOrdinal("FundTitle")),
                FundCategory = reader.GetString(reader.GetOrdinal("FundCategory")),
                Description = reader.GetString(reader.GetOrdinal("Description")),
                TargetAmount = reader.GetDecimal(reader.GetOrdinal("TargetAmount")),
                CollectedAmount = reader.GetDecimal(reader.GetOrdinal("CollectedAmount")),
                UrgencyLevel = reader.GetString(reader.GetOrdinal("UrgencyLevel")),

                StartDate = reader.GetDateTime(reader.GetOrdinal("StartDate")),
                EndDate = reader.GetDateTime(reader.GetOrdinal("EndDate")),

                SupportingDocumentUrl = reader.IsDBNull(reader.GetOrdinal("SupportingDocumentUrl")) ? null : reader.GetString(reader.GetOrdinal("SupportingDocumentUrl")),
                BeneficiaryPhotoUrl = reader.IsDBNull(reader.GetOrdinal("BeneficiaryPhotoUrl")) ? null : reader.GetString(reader.GetOrdinal("BeneficiaryPhotoUrl")),

                AccountHolderName = reader.GetString(reader.GetOrdinal("AccountHolderName")),
                BankAccountNumber = reader.GetString(reader.GetOrdinal("BankAccountNumber")),
                IFSCCode = reader.GetString(reader.GetOrdinal("IFSCCode")),
                UPIId = reader.IsDBNull(reader.GetOrdinal("UPIId")) ? null : reader.GetString(reader.GetOrdinal("UPIId")),

                Status = reader.GetString(reader.GetOrdinal("Status")),
                CreatedBy = reader.GetString(reader.GetOrdinal("CreatedBy")),
                CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                BalanceAmount = reader.IsDBNull(reader.GetOrdinal("BalanceAmount"))
    ? 0
    : reader.GetDecimal(reader.GetOrdinal("BalanceAmount")),
                MinimumAmount = reader.IsDBNull(reader.GetOrdinal("MinimumAmount"))
    ? 0
    : reader.GetDecimal(reader.GetOrdinal("MinimumAmount"))

            };
        }
    }
}