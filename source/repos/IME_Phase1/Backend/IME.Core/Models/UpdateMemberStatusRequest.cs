using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IME.Core.Models
{
    public  class UpdateMemberStatusRequest
    {
        public string Status { get; set; } = string.Empty;
        public string? Reason { get; set; } // only for reject
    }
}
