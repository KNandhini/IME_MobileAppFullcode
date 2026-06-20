using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IME.Core.Models
{
    public class ClubAdminMember
    {
        public int MemberId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? ContactNumber { get; set; }
        public string? ProfilePhotoPath { get; set; }
        public string? ProfilePhotoBase64 { get; set; }
        public int RoleId { get; set; }
        public string? RoleName { get; set; }
        public string? ClubId { get; set; }
        public string? ClubName { get; set; }
    }
}
