using IME.Core.Interfaces;
using IME.Infrastructure.Data;
using IME.Infrastructure.Repositories;
using IME.Infrastructure.Services;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger configuration
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "IME API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
// ?? ADD THESE before builder.Build() ??????????????????????????????????????????

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 104857600; // 100 MB
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
    options.KeyLengthLimit = int.MaxValue;
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 104857600; // 100 MB
});

// Configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var uploadPath = builder.Configuration["FileStorage:UploadPath"] ?? "Uploads";

// Register DatabaseContext
builder.Services.AddSingleton(new DatabaseContext(connectionString!));

// Register Repositories
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IMemberRepository, MemberRepository>();
builder.Services.AddScoped<IActivityRepository, ActivityRepository>();

builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IFeedRepository, FeedRepository>();
builder.Services.AddScoped<INewsRepository, NewsRepository>();
builder.Services.AddScoped<IFundraiseRepository, FundraiseRepository>();
builder.Services.AddScoped<IRaiseFundPayment, RaiseFundPaymentRepository>();
builder.Services.AddScoped<ISupportRepository, SupportRepository>();
builder.Services.AddScoped<IClubRepository, ClubRepository>();
builder.Services.AddScoped<IChatRepository, ChatRepository>();
builder.Services.AddScoped<ICircularRepository, CircularRepository>();
builder.Services.AddScoped<IAchievementRepository, AchievementRepository>();
builder.Services.AddHttpClient();

builder.Services.AddScoped<LawBotService>();
builder.Services.AddScoped<IMunicipalCorpRepository, MunicipalCorpRepository>();
builder.Services.AddScoped<ILocalBodyRepository, LocalBodyRepository>();

// Reads LocalBodies_URLs.csv once at startup — path in appsettings "LocalBodiesUrlFile"
builder.Services.AddSingleton<CsvUrlRegistryService>();
builder.Services.AddScoped<IAIUrlResolverService, AIUrlResolverService>();
builder.Services.AddScoped<IWebScraperService, WebScraperService>();
builder.Services.AddHttpClient("scraper", client =>
{
    client.DefaultRequestHeaders.Add("User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    client.DefaultRequestHeaders.Add("Accept",
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
    client.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9,ta;q=0.8");
    // NOTE: Do NOT add Accept-Encoding manually — AutomaticDecompression below handles
    // gzip/deflate and adds the header itself. Adding it manually causes binary data
    // to be returned without being decompressed (garbled Wikipedia response).
    client.DefaultRequestHeaders.Add("Upgrade-Insecure-Requests", "1");
    client.Timeout = TimeSpan.FromSeconds(55); // must be > all CTSs (15 s main, 50 s tnurbantree)
})
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    // Auto-decompress gzip/deflate/brotli so content is always readable text
    AutomaticDecompression = System.Net.DecompressionMethods.GZip
                           | System.Net.DecompressionMethods.Deflate
                           | System.Net.DecompressionMethods.Brotli,
    // Allow cookies — some government sites (tnurbantree) need a session cookie to respond
    UseCookies = true,
    CookieContainer = new System.Net.CookieContainer(),
    // Follow redirects automatically (gov sites often redirect http → https)
    AllowAutoRedirect = true,
    MaxAutomaticRedirections = 5,
    // Don't fail on invalid SSL certificates (some .tn.gov.in sites have cert issues)
    ServerCertificateCustomValidationCallback =
        HttpClientHandler.DangerousAcceptAnyServerCertificateValidator,
});
// Register Services
builder.Services.AddSingleton(new JwtService(
    jwtSettings["SecretKey"]!,
    jwtSettings["Issuer"]!,
    jwtSettings["Audience"]!,
    int.Parse(jwtSettings["ExpiryMinutes"]!)
));
builder.Services.AddSingleton<PasswordService>();
builder.Services.AddSingleton(sp => new FileStorageService(uploadPath));
builder.Services.AddScoped<EmailService>();
builder.Services.AddSingleton<EmailTemplateService>();

// JWT Authentication
var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]!);
builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();

app.UseCors("AllowAll");
app.UseStaticFiles(); // ✅ FIRST
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "Uploads")),
    RequestPath = "/Uploads"
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Ensure uploads directory exists
var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), uploadPath);
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}


app.Run();