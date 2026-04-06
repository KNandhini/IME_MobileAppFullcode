using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
public class EmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var host = _config["EmailSettings:Host"] ?? throw new InvalidOperationException("EmailSettings:Host is not configured");
        var port = int.Parse(_config["EmailSettings:Port"] ?? throw new InvalidOperationException("EmailSettings:Port is not configured"));
        var username = _config["EmailSettings:Username"] ?? throw new InvalidOperationException("EmailSettings:Username is not configured");
        var password = _config["EmailSettings:Password"] ?? throw new InvalidOperationException("EmailSettings:Password is not configured");
        var from = _config["EmailSettings:FromEmail"] ?? throw new InvalidOperationException("EmailSettings:FromEmail is not configured");
        var fromName = _config["EmailSettings:FromName"] ?? "Admin";

        var smtpClient = new SmtpClient(host)
        {
            Port = port,
            Credentials = new NetworkCredential(username, password),
            EnableSsl = true,
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(from, fromName), // ✅ uses FromName too
            Subject = subject,
            Body = body,
            IsBodyHtml = true,
        };

        mailMessage.To.Add(toEmail);
        await smtpClient.SendMailAsync(mailMessage);
    }
}