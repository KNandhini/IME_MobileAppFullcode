using IME.Core.Models;

namespace IME.Core.Interfaces;

public interface IMemberRepository
{
    Task<Member?> GetMemberProfileAsync(int memberId);
    Task<bool> UpdateMemberProfileAsync(Member member);
    Task<List<Member>> GetAllMembersAsync(int pageNumber, int pageSize);
    Task<List<Member>> GetMembersByClubAsync(int pageNumber, int pageSize, int clubId);
    Task<bool> UpdateMemberStatusAsync(int memberId, string status, string? reason);
     Task<bool> DeleteMemberAsync(int memberId);
}
