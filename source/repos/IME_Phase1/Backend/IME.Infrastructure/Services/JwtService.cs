using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
namespace IME.Infrastructure.Services;
public class JwtService
{
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expiryMinutes;

    // Default changed from 480 (8 hours) to 1440 (24 hours / 1 day).
    // If JwtService is constructed elsewhere (e.g. Program.cs) with an
    // explicit expiryMinutes value pulled from appsettings.json, update
    // that config value to 1440 as well — the constructor argument
    // always wins over this default.
    public JwtService(string secretKey, string issuer, string audience, int expiryMinutes = 1440)
    {
        _secretKey = secretKey;
        _issuer = issuer;
        _audience = audience;
        _expiryMinutes = expiryMinutes;
    }
    public (string Token, DateTimeOffset ExpiresAt) GenerateToken(int userId, int roleId, string roleName, int? memberId, string email)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_secretKey);
        var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
        new Claim(ClaimTypes.Email, email),
        new Claim(ClaimTypes.Role, roleName),
        new Claim("RoleId", roleId.ToString())
    };
        if (memberId.HasValue)
        {
            claims.Add(new Claim("MemberId", memberId.Value.ToString()));
        }
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(_expiryMinutes);

        var istOffset = TimeSpan.FromHours(5.5);
        var expiresAtIst = new DateTimeOffset(expiresAtUtc, TimeSpan.Zero).ToOffset(istOffset);

        // Truncate to millisecond precision — DateTimeOffset carries tick-level
        // precision (7 fractional digits) by default, which JS Date cannot
        // reliably parse (esp. on Hermes/React Native). Millisecond precision
        // is what JSON/JS expects, so truncate before returning.
        expiresAtIst = new DateTimeOffset(
            expiresAtIst.Year, expiresAtIst.Month, expiresAtIst.Day,
            expiresAtIst.Hour, expiresAtIst.Minute, expiresAtIst.Second,
            expiresAtIst.Millisecond,
            expiresAtIst.Offset);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAtUtc, // ? stays UTC — do not change this one
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return (tokenHandler.WriteToken(token), expiresAtIst);
    }
    public ClaimsPrincipal? ValidateToken(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_secretKey);
        try
        {
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
            var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
            return principal;
        }
        catch
        {
            return null;
        }
    }
}