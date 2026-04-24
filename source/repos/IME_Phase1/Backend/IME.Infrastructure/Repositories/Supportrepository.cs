using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Data;
using System.Data;
using System.Data.SqlClient;

namespace IME.Infrastructure.Repositories;

public class SupportRepository : ISupportRepository
{
    private readonly DatabaseContext _dbContext;

    public SupportRepository(DatabaseContext dbContext)
    {
        _dbContext = dbContext;
    }

    // ── Get Active Categories ─────────────────────────────────────────────────
    public async Task<List<SupportCategoryDTO>> GetActiveCategoriesAsync()
    {
        var list = new List<SupportCategoryDTO>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetSupportCategories", connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            list.Add(new SupportCategoryDTO
            {
                CategoryId = reader.GetInt32(reader.GetOrdinal("CategoryId")),
                CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
            });
        }

        return list;
    }

    // ── Get By Category ───────────────────────────────────────────────────────
    public async Task<List<SupportDTO>> GetByCategoryAsync(int categoryId)
    {
        var list = new List<SupportDTO>();

        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetSupportByCategory", connection);
        command.Parameters.AddWithValue("@CategoryId", categoryId);

        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
            list.Add(MapToSupportDTO(reader));

        return list;
    }

    // ── Get By Id (with attachments) ──────────────────────────────────────────
    public async Task<SupportDetailDTO?> GetByIdAsync(int supportId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_GetSupportById", connection);
        command.Parameters.AddWithValue("@SupportId", supportId);

        using var reader = await command.ExecuteReaderAsync();

        SupportDetailDTO? detail = null;

        // Result set 1 — support record
        if (await reader.ReadAsync())
        {
            var amountOrdinal = reader.GetOrdinal("Amount");
            detail = new SupportDetailDTO
            {
                SupportId = reader.GetInt32(reader.GetOrdinal("SupportId")),
                CategoryId = reader.GetInt32(reader.GetOrdinal("CategoryId")),
                CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                ClubId = reader.IsDBNull(reader.GetOrdinal("ClubId")) ? null : reader.GetInt32(reader.GetOrdinal("ClubId")),   // ✅ ADD
                ClubName = reader.IsDBNull(reader.GetOrdinal("ClubName")) ? null : reader.GetString(reader.GetOrdinal("ClubName")), // ✅ ADD
                PhotoPath = reader.IsDBNull(reader.GetOrdinal("PhotoPath")) ? null : reader.GetString(reader.GetOrdinal("PhotoPath")),
                PersonName = reader.IsDBNull(reader.GetOrdinal("PersonName")) ? null : reader.GetString(reader.GetOrdinal("PersonName")),
                Title = reader.GetString(reader.GetOrdinal("Title")),
                Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                SupportDate = reader.IsDBNull(reader.GetOrdinal("SupportDate")) ? null : reader.GetDateTime(reader.GetOrdinal("SupportDate")),
                CompanyOrIndividual = reader.IsDBNull(reader.GetOrdinal("CompanyOrIndividual")) ? null : reader.GetString(reader.GetOrdinal("CompanyOrIndividual")),
                CompanyName = reader.IsDBNull(reader.GetOrdinal("CompanyName")) ? null : reader.GetString(reader.GetOrdinal("CompanyName")),
                Amount = reader.IsDBNull(amountOrdinal) ? (decimal?)null : reader.GetDecimal(amountOrdinal),
                CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                UpdatedDate = reader.IsDBNull(reader.GetOrdinal("UpdatedDate")) ? null : reader.GetDateTime(reader.GetOrdinal("UpdatedDate")),
            };
        }

        // Result set 2 — attachments
        if (detail != null && await reader.NextResultAsync())
        {
            while (await reader.ReadAsync())
            {
                detail.Attachments.Add(new SupportAttachmentDTO
                {
                    AttachmentId = reader.GetInt32(reader.GetOrdinal("AttachmentId")),
                    FileName = reader.GetString(reader.GetOrdinal("FileName")),
                    FilePath = reader.IsDBNull(reader.GetOrdinal("FilePath")) ? null : reader.GetString(reader.GetOrdinal("FilePath")),
                    UploadedDate = reader.GetDateTime(reader.GetOrdinal("UploadedDate")),

                    SortOrder = reader.GetInt32(reader.GetOrdinal("SortOrder")),
                    MediaType = reader.GetString(reader.GetOrdinal("MediaType")),
                });
            }
        }

        return detail;
    }

    // ── Create ────────────────────────────────────────────────────────────────
    public async Task<int> CreateAsync(CreateSupportDTO dto)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_CreateSupport", connection);

        command.Parameters.AddWithValue("@CategoryId", dto.CategoryId);
        command.Parameters.AddWithValue("@ClubId", (object?)dto.ClubId ?? DBNull.Value); // ✅ ADD
        command.Parameters.AddWithValue("@PhotoPath", (object?)dto.PhotoPath ?? DBNull.Value);
        command.Parameters.AddWithValue("@PersonName", (object?)dto.PersonName ?? DBNull.Value);
        command.Parameters.AddWithValue("@Title", dto.Title);
        command.Parameters.AddWithValue("@Description", (object?)dto.Description ?? DBNull.Value);
        command.Parameters.AddWithValue("@SupportDate", (object?)dto.SupportDate ?? DBNull.Value);
        command.Parameters.AddWithValue("@CompanyOrIndividual", (object?)dto.CompanyOrIndividual ?? DBNull.Value);
        command.Parameters.AddWithValue("@CompanyName", (object?)dto.CompanyName ?? DBNull.Value);
        command.Parameters.AddWithValue("@CreatedBy", dto.CreatedBy);

        var param = command.Parameters.Add("@Amount", SqlDbType.Decimal);
        param.Precision = 18;
        param.Scale = 2;
        param.Value = dto.Amount ?? (object)DBNull.Value;

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("SupportId"));

        return 0;
    }

    // ── Update ────────────────────────────────────────────────────────────────
    public async Task<bool> UpdateAsync(int supportId, UpdateSupportDTO dto)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_UpdateSupport", connection);

        command.Parameters.AddWithValue("@SupportId", supportId);
        command.Parameters.AddWithValue("@CategoryId", dto.CategoryId);
        command.Parameters.AddWithValue("@ClubId", (object?)dto.ClubId ?? DBNull.Value); // ✅ ADD
        command.Parameters.AddWithValue("@PhotoPath", (object?)dto.PhotoPath ?? DBNull.Value);
        command.Parameters.AddWithValue("@PersonName", (object?)dto.PersonName ?? DBNull.Value);
        command.Parameters.AddWithValue("@Title", dto.Title);
        command.Parameters.AddWithValue("@Description", (object?)dto.Description ?? DBNull.Value);
        command.Parameters.AddWithValue("@SupportDate", (object?)dto.SupportDate ?? DBNull.Value);
        command.Parameters.AddWithValue("@CompanyOrIndividual", (object?)dto.CompanyOrIndividual ?? DBNull.Value);
        command.Parameters.AddWithValue("@CompanyName", (object?)dto.CompanyName ?? DBNull.Value);

        var param = command.Parameters.Add("@Amount", SqlDbType.Decimal);
        param.Precision = 18;
        param.Scale = 2;
        param.Value = dto.Amount ?? (object)DBNull.Value;

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;

        return false;
    }
    // ── Delete ────────────────────────────────────────────────────────────────
    public async Task<bool> DeleteAsync(int supportId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteSupport", connection);

        command.Parameters.AddWithValue("@SupportId", supportId);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;

        return false;
    }

    // ── Add Attachment ────────────────────────────────────────────────────────
   

    // ── Delete Attachment ─────────────────────────────────────────────────────
    public async Task<bool> DeleteAttachmentAsync(int attachmentId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_DeleteSupportAttachment", connection);

        command.Parameters.AddWithValue("@AttachmentId", attachmentId);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("RowsAffected")) > 0;

        return false;
    }
    public async Task<int> AddAttachmentAsync(AddAttachmentDTO dto)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateStoredProcCommand("sp_AddSupportAttachment", connection);

        command.Parameters.AddWithValue("@SupportId", dto.SupportId);
        command.Parameters.AddWithValue("@FileName", dto.FileName);
        command.Parameters.AddWithValue("@FilePath", dto.FilePath);
        command.Parameters.AddWithValue("@MediaType", dto.MediaType);
        command.Parameters.AddWithValue("@SortOrder", dto.SortOrder);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
            return reader.GetInt32(reader.GetOrdinal("AttachmentId"));

        return 0;
    }

    public async Task<SupportAttachmentDTO?> GetAttachmentByIdAsync(int attachmentId)
    {
        using var connection = await _dbContext.CreateOpenConnectionAsync();
        using var command = _dbContext.CreateCommand(
            "SELECT AttachmentId, FileName, FilePath, MediaType, SortOrder, UploadedDate " +
            "FROM tbl_SupportAttachments WHERE AttachmentId = @AttachmentId", connection);

        command.Parameters.AddWithValue("@AttachmentId", attachmentId);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new SupportAttachmentDTO
            {
                AttachmentId = reader.GetInt32(reader.GetOrdinal("AttachmentId")),
                FileName = reader.GetString(reader.GetOrdinal("FileName")),
                FilePath = reader.IsDBNull(reader.GetOrdinal("FilePath")) ? null : reader.GetString(reader.GetOrdinal("FilePath")),
                MediaType = reader.IsDBNull(reader.GetOrdinal("MediaType")) ? "document" : reader.GetString(reader.GetOrdinal("MediaType")).Trim(),
                SortOrder = reader.GetInt32(reader.GetOrdinal("SortOrder")),
                UploadedDate = reader.GetDateTime(reader.GetOrdinal("UploadedDate")),
            };
        }
        return null;
    }

    // ── Private Mapper ────────────────────────────────────────────────────────
    private static SupportDTO MapToSupportDTO(SqlDataReader reader)
    {
        return new SupportDTO
        {
            SupportId = reader.GetInt32(reader.GetOrdinal("SupportId")),
            PhotoPath = reader.IsDBNull(reader.GetOrdinal("PhotoPath")) ? null : reader.GetString(reader.GetOrdinal("PhotoPath")),
            PersonName = reader.IsDBNull(reader.GetOrdinal("PersonName")) ? null : reader.GetString(reader.GetOrdinal("PersonName")),
            Title = reader.GetString(reader.GetOrdinal("Title")),
            Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
            SupportDate = reader.IsDBNull(reader.GetOrdinal("SupportDate")) ? null : reader.GetDateTime(reader.GetOrdinal("SupportDate")),
            CompanyOrIndividual = reader.IsDBNull(reader.GetOrdinal("CompanyOrIndividual")) ? null : reader.GetString(reader.GetOrdinal("CompanyOrIndividual")),
            CompanyName = reader.IsDBNull(reader.GetOrdinal("CompanyName")) ? null : reader.GetString(reader.GetOrdinal("CompanyName")),
            CategoryId = reader["CategoryId"] == DBNull.Value ? 0 : Convert.ToInt32(reader["CategoryId"]),
            CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
            ClubId = reader["ClubId"] == DBNull.Value ? null : Convert.ToInt32(reader["ClubId"]),    // ✅ ADD
            ClubName = reader["ClubName"] == DBNull.Value ? null : reader["ClubName"].ToString(),        // ✅ ADD
            Amount = reader["Amount"] == DBNull.Value ? null : Convert.ToDecimal(reader["Amount"]),
            CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
        };
    }
}