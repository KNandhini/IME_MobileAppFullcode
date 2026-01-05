import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { X } from "lucide-react";
import { InsertUser } from "../../../services/api";
interface UserFormProps {
  show: boolean;
  handleClose: () => void;
  //onSubmit: (values: { name: string; email: string; roles: string[] }) => void;
  //user?: { id?: string; name: string; email: string; roles: string[] } | null;
  onSubmit: (values: InsertUser) => void;
  user?: { id?: string; name: string; email: string; roles: string[]; createdBy?: string; createdDate?: string; modifiedBy?: string; modifiedDate?: string } | null;
}

const AddUserManagement: React.FC<UserFormProps> = ({
  show,
  handleClose,
  onSubmit,
  user,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useLocation();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const goBack = () => setLocation("/users");

  const validationSchema = Yup.object({
    name: Yup.string()
      .matches(/^[A-Za-z ]*$/, "Only letters and spaces are allowed")
      .required("Name is required"),
    email: Yup.string()
  .transform((value) => value?.toLowerCase().replace(/\s+/g, "")) // lowercase & trim spaces
  .matches(
    /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/,
    "Invalid email format"
  )
  .test(
    "no-consecutive-dots",
    "Email cannot have consecutive dots",
    (value) => (value ? !/\.{2,}/.test(value) : true)
  )
  .test(
    "no-duplicate-tlds",
    "Email cannot have duplicate TLDs like .com.com or .au.au",
    (value) => {
      if (!value) return true;
      // Take the domain part
      const domain = value.split("@")[1];
      if (!domain) return false;

      // Split by dots
      const parts = domain.split(".");
      // Check if last two are same (e.g. com.com, au.au)
      if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
        return false;
      }
      return true;
    }
  )
  .email("Invalid email format")
  .required("Email is required"),

    role: Yup.string()
      .oneOf(["admin", "user"], "Invalid role")
      .required("Role is required"),
  });

 {/*} const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: user?.id || "",
      name: user?.name || "",
      email: user?.email || "",
      role: user?.roles?.[0] || "", // pick first role if editing
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      try {
        onSubmit({
          name: values.name,
          email: values.email,
          roles: [values.role], // wrap role in array
        });
        resetForm();
        handleClose();
      } finally {
        setSubmitting(false);
      }
    },
  });*/}
const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: user?.id || "",
      name: user?.name || "",
      email: user?.email || "",
      role: user?.roles?.[0] || "",
      createdBy: user?.createdBy || "",
      createdDate: user?.createdDate || "",
      modifiedBy: user?.modifiedBy || "",
      modifiedDate: user?.modifiedDate || "",
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      try {
        if (user) {
          // ✅ Editing → add modifiedBy & modifiedDate
          onSubmit({
            name: values.name,
            email: values.email,
            roles: [values.role],
            modifiedBy: currentUser?.name || "System",
            modifiedDate: new Date().toISOString(),
            createdBy: user.createdBy, // keep original
            createdDate: user.createdDate,
          });
        } else {
          // ✅ Creating → add createdBy & createdDate
          onSubmit({
            name: values.name,
            email: values.email,
            roles: [values.role],
            createdBy: currentUser?.name || "System",
            createdDate: new Date().toISOString(),
          });
        }
        resetForm();
        handleClose();
      } finally {
        setSubmitting(false);
      }
    },
  });
  if (!show) return null;

  const renderLabel = (text: string) => (
    <Label>
      {text} <span style={{ color: "red" }}>*</span>
    </Label>
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 8,
          width: 400,
          maxWidth: "90%",
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {user ? "Edit User" : "Add User"}
          </h1>
          <button onClick={handleClose} aria-label="Close">
            <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: 15 }}>
            {renderLabel("Name")}
            <Input
              id="name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              maxLength={50}
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                e.currentTarget.value = e.currentTarget.value.replace(
                  /[^A-Za-z ]/g,
                  ""
                );
              }}
            />
            {formik.touched.name && formik.errors.name && (
              <div style={{ color: "red" }}>{formik.errors.name}</div>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 15 }}>
            {renderLabel("Email")}
            <Input
              id="email"
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                const target = e.currentTarget;
                target.value = target.value
                  .toLowerCase()
                  .replace(/\s+/g, "")
                  .replace(/[^a-z0-9@._-]/g, "");
              }}
            />
            {formik.touched.email && formik.errors.email && (
              <div style={{ color: "red" }}>{formik.errors.email}</div>
            )}
          </div>

          {/* Role */}
          <div style={{ marginBottom: 15 }}>
            {renderLabel("Role")}
            <select
              id="role"
              name="role"
              value={formik.values.role}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            {formik.touched.role && formik.errors.role && (
              <div style={{ color: "red" }}>{formik.errors.role}</div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-3">
            <Button
              type="button"
            //  onClick={() => formik.resetForm()}
             onClick={() => {
    // Reset form and clear values completely
    formik.setValues({
                  id: user?.id || "",
                  name: "",
                  email: "",
                  role: "",
                  createdBy: user?.createdBy || "",
                  createdDate: user?.createdDate || "",
                  modifiedBy: user?.modifiedBy || "",
                  modifiedDate: user?.modifiedDate || "",
                })
  }}
  
              disabled={submitting}
              variant="outline"
            >
              Clear
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? user
                  ? "Updating..."
                  : "Adding..."
                : user
                ? "Update"
                : "Add"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserManagement;
