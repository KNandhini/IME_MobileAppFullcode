namespace IME.Core.DTOs;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
}

public class FileUploadDTO
{
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
}

public class NotificationDTO
{
    public int NotificationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ModuleName { get; set; }
    public int? ReferenceId { get; set; }
    public bool IsRead { get; set; }
    public DateTime SentDate { get; set; }
}

public class DesignationDTO
{
    public int DesignationId { get; set; }
    public string DesignationName { get; set; } = string.Empty;
}

public class RoleDTO
{
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class PaymentRequestDTO
{
    public int MemberId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = string.Empty;
    public string TransactionReference { get; set; } = string.Empty;
}

public class PaymentOrderDTO
{
    public int MemberId { get; set; }
}

public class PaymentVerificationDTO
{
    public string RazorpayPaymentId { get; set; } = string.Empty;
    public string RazorpayOrderId { get; set; } = string.Empty;
    public string RazorpaySignature { get; set; } = string.Empty;
    public int MemberId { get; set; }
    public int FeeId { get; set; }
    public decimal Amount { get; set; }
}

public class QRPaymentDTO
{
    public int MemberId { get; set; }
}

public class QRPaymentConfirmDTO
{
    public int MemberId { get; set; }
    public int FeeId { get; set; }
    public decimal Amount { get; set; }
    public string TransactionReference { get; set; } = string.Empty;
}

public class SetFeeDTO
{
    public decimal Amount { get; set; }
    public DateTime EffectiveFrom { get; set; }
}

public class CreateNotificationDTO
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ModuleName { get; set; }
    public int? ReferenceId { get; set; }
    public int? UserId { get; set; }
}

public class FileUploadResponseDTO
{
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public int? AttachmentId { get; set; }
}
