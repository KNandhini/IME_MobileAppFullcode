using IME.Core.Models;

namespace IME.Core.Interfaces;

public interface IMemberRepository
{
    Task<Member?> GetMemberProfileAsync(int memberId);
    Task<bool> UpdateMemberProfileAsync(Member member);
    Task<List<Member>> GetAllMembersAsync(int pageNumber, int pageSize);
    Task<bool> UpdateMemberStatusAsync(int memberId, string status);
}
