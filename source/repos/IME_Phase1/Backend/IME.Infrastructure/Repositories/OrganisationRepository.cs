using IME.Core.Interfaces;
using IME.Core.Models;
using IME.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IME.Infrastructure.Repositories
{
    public class OrganisationRepository(DatabaseContext dbContext) : IOrganisationRepository
    {
        private readonly DatabaseContext _dbContext = dbContext;

        public async Task<List<ClubAdminMember>> GetClubAdminMembersAsync(int clubId)
        {
            var admins = new List<ClubAdminMember>();

            using var connection = await _dbContext.CreateOpenConnectionAsync();
            using var command = _dbContext.CreateStoredProcCommand("sp_GetClubAdminMembers", connection);

            command.Parameters.AddWithValue("@ClubId", clubId);

            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                admins.Add(new ClubAdminMember
                {
                    MemberId = reader.GetInt32(reader.GetOrdinal("MemberId")),
                    UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                    FullName = reader.GetString(reader.GetOrdinal("FullName")),

                    Email = reader.IsDBNull(reader.GetOrdinal("Email"))
                        ? null
                        : reader.GetString(reader.GetOrdinal("Email")),

                    ContactNumber = reader.IsDBNull(reader.GetOrdinal("ContactNumber"))
                        ? null
                        : reader.GetString(reader.GetOrdinal("ContactNumber")),

                    ProfilePhotoPath = reader.IsDBNull(reader.GetOrdinal("ProfilePhotoPath"))
                        ? null
                        : reader.GetString(reader.GetOrdinal("ProfilePhotoPath")),

                  /*  ProfilePhotoBase64 = reader.IsDBNull(reader.GetOrdinal("ProfilePhotoBase64"))
                        ? null
                        : reader.GetString(reader.GetOrdinal("ProfilePhotoBase64")),*/

                    RoleId = reader.GetInt32(reader.GetOrdinal("RoleId")),

                    RoleName = reader.IsDBNull(reader.GetOrdinal("RoleName"))
                        ? null
                        : reader.GetString(reader.GetOrdinal("RoleName")),

                    ClubId = reader.IsDBNull(reader.GetOrdinal("ClubId"))
                        ? null
                        : reader.GetString(reader.GetOrdinal("ClubId")),

                    ClubName = reader.IsDBNull(reader.GetOrdinal("ClubName"))
                        ? null
                        : reader.GetString(reader.GetOrdinal("ClubName")),
                });
            }

            return admins;
        }
    }
}
