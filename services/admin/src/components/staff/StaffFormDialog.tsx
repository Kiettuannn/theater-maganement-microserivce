import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import type { StaffProfile } from "@/types/StaffType/StaffProfile";
import type { StaffRequest } from "@/services/staffService";
import { getAllCinemas, type Cinema } from "@/services/cinemaService";
import { getAllRoles, type Role } from "@/services/roleService";

interface StaffFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StaffRequest) => Promise<boolean>;
  staff?: StaffProfile | null;
  saving?: boolean;
}

export function StaffFormDialog({
  isOpen,
  onClose,
  onSubmit,
  staff,
  saving = false,
}: StaffFormDialogProps) {
  const [formData, setFormData] = useState<StaffRequest>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    jobTitle: "",
    gender: "MALE",
    dob: "",
    username: "",
    password: "",
    cinemaId: "",
    roles: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loadingCinemas, setLoadingCinemas] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Load cinemas and roles when dialog opens
  useEffect(() => {
    const loadData = async () => {
      if (isOpen) {
        try {
          setLoadingCinemas(true);
          setLoadingRoles(true);
          const [cinemasData, rolesData] = await Promise.all([
            getAllCinemas(),
            getAllRoles(),
          ]);
          setCinemas(cinemasData);
          setRoles(rolesData);
        } catch (error) {
          console.error("Failed to load data:", error);
        } finally {
          setLoadingCinemas(false);
          setLoadingRoles(false);
        }
      }
    };
    loadData();
  }, [isOpen]);

  useEffect(() => {
    if (staff) {
      const staffRoleNames = staff.roles?.map((r) => r.name) || [];
      setSelectedRoles(staffRoleNames);
      setFormData({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phoneNumber: staff.phoneNumber,
        address: staff.address,
        jobTitle: staff.jobTitle,
        gender: staff.gender,
        dob: staff.dob,
        username: staff.username,
        password: "", // Reset password when editing
        cinemaId: staff.cinemaId || "",
        roles: staffRoleNames,
      });
    } else {
      setSelectedRoles(["STAFF"]); // Default to STAFF role
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        address: "",
        jobTitle: "",
        gender: "MALE",
        dob: "",
        username: "",
        password: "",
        cinemaId: "",
        roles: ["STAFF"],
      });
    }
    setErrors({});
  }, [staff, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = "Phone number is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.jobTitle.trim()) newErrors.jobTitle = "Job title is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (!formData.cinemaId?.trim())
      newErrors.cinemaId = "Cinema ID is required";
    if (!staff && !formData.username.trim())
      newErrors.username = "Username is required";
    if (!staff && !formData.password?.trim())
      newErrors.password = "Password is required";
    if (formData.password && formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRoleToggle = (roleName: string) => {
    setSelectedRoles((prev) => {
      const newRoles = prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName];

      // Update formData with new roles
      setFormData((prevData) => ({
        ...prevData,
        roles: newRoles,
      }));

      return newRoles;
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={staff ? "Edit Staff" : "Add New Staff"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name and Last Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              First Name
            </label>
            <Input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First name"
              disabled={saving}
              className={errors.firstName ? "border-destructive" : ""}
            />
            {errors.firstName && (
              <p className="text-xs text-destructive mt-1">
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Last Name
            </label>
            <Input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last name"
              disabled={saving}
              className={errors.lastName ? "border-destructive" : ""}
            />
            {errors.lastName && (
              <p className="text-xs text-destructive mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground">
            Email{" "}
            {staff && (
              <span className="text-muted-foreground">(read-only)</span>
            )}
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@example.com"
            disabled={saving || !!staff}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground">
            Phone Number
          </label>
          <Input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="0123456789"
            disabled={saving}
            className={errors.phoneNumber ? "border-destructive" : ""}
          />
          {errors.phoneNumber && (
            <p className="text-xs text-destructive mt-1">
              {errors.phoneNumber}
            </p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-foreground">
            Address
          </label>
          <Input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Address"
            disabled={saving}
            className={errors.address ? "border-destructive" : ""}
          />
          {errors.address && (
            <p className="text-xs text-destructive mt-1">{errors.address}</p>
          )}
        </div>

        {/* Job Title and Cinema ID */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Job Title
            </label>
            <Input
              type="text"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="e.g. Manager, Cleaner, etc."
              disabled={saving}
              className={errors.jobTitle ? "border-destructive" : ""}
            />
            {errors.jobTitle && (
              <p className="text-xs text-destructive mt-1">{errors.jobTitle}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Cinema
            </label>
            <select
              name="cinemaId"
              value={formData.cinemaId || ""}
              onChange={handleChange}
              disabled={saving || loadingCinemas}
              className={`w-full px-3 py-2 border border-input rounded-md bg-background text-foreground ${
                errors.cinemaId ? "border-destructive" : ""
              }`}
            >
              <option value="">
                {loadingCinemas ? "Loading cinemas..." : "Select a cinema"}
              </option>
              {cinemas.map((cinema) => (
                <option key={cinema.id} value={cinema.id}>
                  {cinema.name} - {cinema.city}
                </option>
              ))}
            </select>
            {errors.cinemaId && (
              <p className="text-xs text-destructive mt-1">{errors.cinemaId}</p>
            )}
          </div>
        </div>

        {/* Gender and DOB */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={saving}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Date of Birth
            </label>
            <Input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              disabled={saving}
              className={errors.dob ? "border-destructive" : ""}
            />
            {errors.dob && (
              <p className="text-xs text-destructive mt-1">{errors.dob}</p>
            )}
          </div>
        </div>

        {/* Username and Password (only for new staff) */}
        {!staff && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">
                Username
              </label>
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="username"
                disabled={saving}
                className={errors.username ? "border-destructive" : ""}
              />
              {errors.username && (
                <p className="text-xs text-destructive mt-1">
                  {errors.username}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">
                Password
              </label>
              <Input
                type="password"
                name="password"
                value={formData.password || ""}
                onChange={handleChange}
                placeholder="Enter password"
                disabled={saving}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-xs text-destructive mt-1">
                  {errors.password}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Role(s)
            {!staff && (
              <span className="text-xs text-muted-foreground ml-2">
                (Select at least one role)
              </span>
            )}
          </label>
          {loadingRoles ? (
            <p className="text-sm text-muted-foreground">Loading roles...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <button
                  key={role.name}
                  type="button"
                  onClick={() => handleRoleToggle(role.name)}
                  disabled={saving}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedRoles.includes(role.name)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={role.description}
                >
                  {role.name}
                </button>
              ))}
            </div>
          )}
          {selectedRoles.length === 0 && (
            <p className="text-xs text-destructive mt-2">
              Please select at least one role.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : staff ? "Update Staff" : "Create Staff"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
