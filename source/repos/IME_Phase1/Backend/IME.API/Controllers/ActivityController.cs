using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IME.Core.DTOs;
using IME.Core.Interfaces;
using IME.Core.Models;

namespace IME.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActivityController : ControllerBase
{
    private readonly IActivityRepository _activityRepository;

    public ActivityController(IActivityRepository activityRepository)
    {
        _activityRepository = activityRepository;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<Activity>>>> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var activities = await _activityRepository.GetAllActivitiesAsync(pageNumber, pageSize);

            return Ok(new ApiResponse<List<Activity>>
            {
                Success = true,
                Data = activities
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<List<Activity>>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<Activity>>> GetById(int id)
    {
        try
        {
            var activity = await _activityRepository.GetActivityByIdAsync(id);

            if (activity == null)
            {
                return NotFound(new ApiResponse<Activity>
                {
                    Success = false,
                    Message = "Activity not found"
                });
            }

            return Ok(new ApiResponse<Activity>
            {
                Success = true,
                Data = activity
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<Activity>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Create([FromBody] CreateActivityDTO request)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            var activity = new Activity
            {
                ActivityName = request.ActivityName,
                Description = request.Description,
                ActivityDate = request.ActivityDate,
                Venue = request.Venue,
                Time = request.Time,
                ChiefGuest = request.ChiefGuest,
                CreatedBy = userId
            };

            var activityId = await _activityRepository.CreateActivityAsync(activity);

            // Send notification to all users about new activity
            var dbContext = HttpContext.RequestServices.GetRequiredService<IME.Infrastructure.Data.DatabaseContext>();
            await NotificationController.CreateContentNotificationAsync(
                dbContext,
                "Activities",
                activityId,
                "New Activity Added",
                $"New activity: {request.ActivityName}"
            );

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Activity created successfully",
                Data = new { ActivityId = activityId }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Update(int id, [FromBody] UpdateActivityDTO request)
    {
        try
        {
            var activity = new Activity
            {
                ActivityId = id,
                ActivityName = request.ActivityName,
                Description = request.Description,
                ActivityDate = request.ActivityDate,
                Venue = request.Venue,
                Time = request.Time,
                ChiefGuest = request.ChiefGuest
            };

            var success = await _activityRepository.UpdateActivityAsync(activity);

            if (success)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Activity updated successfully"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to update activity"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        try
        {
            var success = await _activityRepository.DeleteActivityAsync(id);

            if (success)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Activity deleted successfully"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = "Failed to delete activity"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error: {ex.Message}"
            });
        }
    }
}
