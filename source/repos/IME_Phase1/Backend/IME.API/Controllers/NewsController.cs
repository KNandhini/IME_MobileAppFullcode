using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Infrastructure.Data;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NewsController : ControllerBase
{
    private readonly INewsRepository _newsRepository;
    private readonly DatabaseContext _dbContext;

    public NewsController(INewsRepository newsRepository, DatabaseContext dbContext)
    {
        _newsRepository = newsRepository;
        _dbContext = dbContext;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    // ?? GET /api/news ?????????????????????????????????????????
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<NewsDTO>>>> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var newsList = await _newsRepository.GetAllNewsAsync(pageNumber, pageSize);
            return Ok(new ApiResponse<List<NewsDTO>> { Success = true, Data = newsList });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<NewsDTO>>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ?? GET /api/news/{id} ????????????????????????????????????
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<NewsDetailDTO>>> GetById(int id)
    {
        try
        {
            var news = await _newsRepository.GetNewsByIdAsync(id);
            if (news == null)
                return NotFound(new ApiResponse<NewsDetailDTO>
                { Success = false, Message = "News not found" });

            return Ok(new ApiResponse<NewsDetailDTO> { Success = true, Data = news });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<NewsDetailDTO>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ?? POST /api/news ????????????????????????????????????????
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] CreateNewsDTO request)
    {
        try
        {
            var newsId = await _newsRepository.CreateNewsAsync(
                request.Title,
                request.ShortDescription,
                request.FullContent,
                request.CoverImagePath,
                GetUserId(),
                request.CreatedDate);

            await NotificationController.CreateContentNotificationAsync(
                _dbContext,
                "News", newsId,
                "New News Article",
                $"New: {request.Title}");

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "News created successfully",
                Data = new { NewsId = newsId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ?? PUT /api/news/{id} ????????????????????????????????????
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] UpdateNewsDTO request)
    {
        try
        {
            var updated = await _newsRepository.UpdateNewsAsync(
                id,
                request.Title,
                request.ShortDescription,
                request.FullContent,
                request.CoverImagePath,
                request.CreatedDate);

            return Ok(new ApiResponse<object>
            {
                Success = updated,
                Message = updated ? "News updated successfully" : "News not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }

    // ?? DELETE /api/news/{id} ?????????????????????????????????
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        try
        {
            var deleted = await _newsRepository.DeleteNewsAsync(id);
            return Ok(new ApiResponse<object>
            {
                Success = deleted,
                Message = deleted ? "News deleted successfully" : "News not found"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            { Success = false, Message = $"Error: {ex.Message}" });
        }
    }
}