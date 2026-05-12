using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IME.Core.Models
{
    public  class Achievement
    {
         public int AchievementId { get; set; }    
        public int MemberId { get; set; }   
        public string MemberName { get; set; } = string.Empty;     
        public string Title { get; set; } = string.Empty;     
        public string? Description { get; set; }     
        public DateTime? AchievementDate { get; set; }    
        public string? PhotoPath { get; set; }   
        public int? CreatedBy { get; set; }    
        public DateTime CreatedDate { get; set; }    
        public DateTime? UpdatedDate { get; set; } 
    }
}
