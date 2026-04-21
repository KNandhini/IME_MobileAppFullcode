using IME.Core.DTOs;
using IME.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IME.Core.Interfaces
{
    public interface IRaiseFundPayment
    {
        Task<RaiseFundPaymentDto?> InsertDonationAsync(RaiseFundPayment dto);
    }
}
