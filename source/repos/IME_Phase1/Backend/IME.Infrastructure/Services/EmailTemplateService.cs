namespace IME.Infrastructure.Services;

public class EmailTemplateService
{
    public string RegistrationSuccess(
        string fullName,
        string email,
        string plainPassword,
        decimal amount,
        string transactionReference,
        DateTime paymentDate)
    {
        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
</head>
<body style=""margin:0;padding:0;background:#F4F6F9;font-family:Arial,Helvetica,sans-serif;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#F4F6F9;padding:32px 0;"">
    <tr>
      <td align=""center"">
        <table width=""600"" cellpadding=""0"" cellspacing=""0""
               style=""max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);"">

          <!-- Header -->
          <tr>
            <td style=""background:#1E3A5F;padding:36px 40px;text-align:center;"">
              <p style=""margin:0 0 6px;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:2px;text-transform:uppercase;"">Indian Municipal Engineers</p>
              <h1 style=""margin:0;color:#D4A017;font-size:28px;font-weight:800;letter-spacing:1px;"">IME</h1>
              <p style=""margin:10px 0 0;color:rgba(255,255,255,0.85);font-size:15px;"">Membership Registration Confirmed</p>
            </td>
          </tr>

          <!-- Success Banner -->
          <tr>
            <td style=""background:#27AE60;padding:14px;text-align:center;"">
              <p style=""margin:0;color:#fff;font-size:15px;font-weight:700;"">✓ &nbsp;Registration &amp; Payment Successful</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style=""background:#ffffff;padding:36px 40px;"">
              <p style=""margin:0 0 20px;font-size:16px;color:#333;"">Dear <strong>{fullName}</strong>,</p>
              <p style=""margin:0 0 28px;font-size:14px;color:#555;line-height:1.7;"">
                Welcome to the IME family! Your membership registration is complete and your account is now <strong style=""color:#27AE60;"">active</strong>.
                Below are your account and payment details for reference.
              </p>

              <!-- Account Details Box -->
              <table width=""100%"" cellpadding=""0"" cellspacing=""0""
                     style=""background:#F0F4FF;border-radius:10px;border:1px solid #BBDEFB;margin-bottom:24px;"">
                <tr>
                  <td style=""padding:20px 24px;"">
                    <p style=""margin:0 0 14px;font-size:13px;font-weight:700;color:#1E3A5F;text-transform:uppercase;letter-spacing:1px;"">Account Details</p>
                    <table width=""100%"" cellpadding=""0"" cellspacing=""0"">
                      <tr>
                        <td style=""padding:6px 0;font-size:14px;color:#888;width:40%;"">Full Name</td>
                        <td style=""padding:6px 0;font-size:14px;color:#222;font-weight:600;"">{fullName}</td>
                      </tr>
                      <tr>
                        <td style=""padding:6px 0;font-size:14px;color:#888;"">Email</td>
                        <td style=""padding:6px 0;font-size:14px;color:#222;font-weight:600;"">{email}</td>
                      </tr>
                      <tr>
                        <td style=""padding:6px 0;font-size:14px;color:#888;"">Password</td>
                        <td style=""padding:6px 0;"">
                          <span style=""background:#1E3A5F;color:#D4A017;font-family:monospace;font-size:15px;font-weight:700;padding:4px 12px;border-radius:6px;letter-spacing:1px;"">{plainPassword}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Payment Details Box -->
              <table width=""100%"" cellpadding=""0"" cellspacing=""0""
                     style=""background:#F9F9F9;border-radius:10px;border:1px solid #E0E0E0;margin-bottom:28px;"">
                <tr>
                  <td style=""padding:20px 24px;"">
                    <p style=""margin:0 0 14px;font-size:13px;font-weight:700;color:#1E3A5F;text-transform:uppercase;letter-spacing:1px;"">Payment Receipt</p>
                    <table width=""100%"" cellpadding=""0"" cellspacing=""0"">
                      <tr>
                        <td style=""padding:6px 0;font-size:14px;color:#888;width:40%;"">Amount Paid</td>
                        <td style=""padding:6px 0;font-size:18px;color:#1E3A5F;font-weight:800;"">₹{amount:F2}</td>
                      </tr>
                      <tr>
                        <td style=""padding:6px 0;font-size:14px;color:#888;"">Payment Date</td>
                        <td style=""padding:6px 0;font-size:14px;color:#222;font-weight:600;"">{paymentDate:dd MMM yyyy, hh:mm tt}</td>
                      </tr>
                      <tr>
                        <td style=""padding:6px 0;font-size:14px;color:#888;"">Transaction ID</td>
                        <td style=""padding:6px 0;font-size:13px;color:#555;font-family:monospace;"">{transactionReference}</td>
                      </tr>
                      <tr>
                        <td style=""padding:6px 0;font-size:14px;color:#888;"">Status</td>
                        <td style=""padding:6px 0;"">
                          <span style=""background:#E8F5E9;color:#27AE60;font-size:13px;font-weight:700;padding:3px 10px;border-radius:20px;"">Success</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style=""margin:0 0 8px;font-size:14px;color:#555;line-height:1.7;"">
                You can now login to the <strong>IME app</strong> using your email and password above.
                Please keep this email safe for your records.
              </p>
              <p style=""margin:0;font-size:14px;color:#555;"">
                For any queries, please contact the IME admin team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style=""background:#1E3A5F;padding:20px 40px;text-align:center;"">
              <p style=""margin:0 0 4px;color:rgba(255,255,255,0.6);font-size:12px;"">This is an automated email. Please do not reply.</p>
              <p style=""margin:0;color:rgba(255,255,255,0.4);font-size:11px;"">© {DateTime.Now.Year} Indian Municipal Engineers. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
    }
}
