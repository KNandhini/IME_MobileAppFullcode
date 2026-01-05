import React, { useState } from "react";
import Swal from "sweetalert2";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AddUserManagement from "./AddUserManagement";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  User,
  InsertUser,
} from "../../../services/api";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";

export default function UserTable() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const usersPerPage = 5;

  // ✅ Users come with id: string
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: listUsers,
  });

   const createMutation = useMutation({
  mutationFn: async (user: InsertUser) => {
    //return await createUser(user); // should return created user JSON
    return await createUser({
      ...user,
      createdBy: currentUser?.name || "System", // ✅ add createdBy
      createdDate: new Date().toISOString(),   // ✅ UTC timestamp
    });
  },
  onSuccess: (newUser: User) => {
    Swal.fire("Success", "User inserted successfully!", "success");
    // update cache instantly
    queryClient.setQueryData<User[]>(["users"], (old = []) => [...old, newUser]);
  },
  onError: (err: any) => {
    Swal.fire("Error", err?.message || "Failed to insert user", "error");
  },
});

const updateMutation = useMutation({
  mutationFn: async ({ id, user }: { id: string; user: Partial<InsertUser> }) => {
  //  return await updateUser(id, user); // should return updated user JSON
  return await updateUser(id, {
      ...user,
      modifiedBy: currentUser?.name || "System", // ✅ add updatedBy
      modifiedDate: new Date().toISOString(),    // ✅ UTC timestamp
    });
  },
  onSuccess: (updatedUser: User) => {
    Swal.fire("Success", "User updated successfully!", "success");
    // update cache instantly
    queryClient.setQueryData<User[]>(["users"], (old = []) =>
      old.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
  },
  onError: (err: any) => {
    Swal.fire("Error", err?.message || "Failed to update user", "error");
  },
});


  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = (id: string) => {

    
    Swal.fire({
      title: "Are you sure?",
      text: "You won’t be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
        Swal.fire("Deleted!", "User has been deleted.", "success");
      }
    });
  };

  const handleModalSubmit = (user: InsertUser) => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, user });
    } else {
      createMutation.mutate(user);
    }
    setShowModal(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLast = page * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);
  console.log("Current Users:", currentUsers);

  return (
    <>
      <div className="list-container">
        <div className="list-header flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <Button onClick={handleAddUser}>
            <Plus className="mr-2" /> Add User
          </Button>
        </div>

        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "0.5rem 1rem",
            marginBottom: "1rem",
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "1rem",
          }}
        />

        {isLoading ? (
          <p>Loading users...</p>
        ) : (
          <>
            <Table className="list-table">
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell>{indexOfFirst + index + 1}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                     <TableCell>
  {user.roles.map((role) => role.charAt(0).toUpperCase() + role.slice(1)).join(", ")}
</TableCell>

                      <TableCell className="action-buttons">
                        <Button
                          size="sm"
                          variant="outline"
                           className="bg-blue-500 text-white border-blue-500 hover:bg-blue-600 mr-2" // Edit button color
                          onClick={() => handleEditUser(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-500 text-white border-red-500 hover:bg-red-600" // Delete button color
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 p-4">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <Pagination className="mt-4 justify-end">
  <PaginationContent>
    {/* Previous button */}
    <PaginationItem>
      <PaginationPrevious
        href="#"
        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
      />
    </PaginationItem>

    {/* First page */}
    <PaginationItem>
      <PaginationLink
        href="#"
        isActive={page === 1}
        onClick={() => setPage(1)}
      >
        1
      </PaginationLink>
    </PaginationItem>

    {/* Ellipsis before current page */}
    {page > 2 && (
      <PaginationItem>
        <PaginationEllipsis />
      </PaginationItem>
    )}

    {/* Current page (if not first/last) */}
    {page > 1 && page < totalPages && (
      <PaginationItem>
        <PaginationLink href="#" isActive>
          {page}
        </PaginationLink>
      </PaginationItem>
    )}

    {/* Ellipsis after current page */}
    {page < totalPages - 1 && (
      <PaginationItem>
        <PaginationEllipsis />
      </PaginationItem>
    )}

    {/* Last page */}
    {totalPages > 1 && (
      <PaginationItem>
        <PaginationLink
          href="#"
          isActive={page === totalPages}
          onClick={() => setPage(totalPages)}
        >
          {totalPages}
        </PaginationLink>
      </PaginationItem>
    )}

    {/* Next button */}
    <PaginationItem>
      <PaginationNext
        href="#"
        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
      />
    </PaginationItem>
  </PaginationContent>
</Pagination>

          </>
        )}
      </div>

      {showModal && (
        <AddUserManagement
          show={showModal}
          handleClose={() => setShowModal(false)}
          onSubmit={handleModalSubmit}
          user={selectedUser}
        />
      )}
    </>
  );
}
