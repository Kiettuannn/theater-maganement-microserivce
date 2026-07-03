import { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Briefcase,
  Building2,
} from "lucide-react";
import { ImageUploader } from "@/components/fileStorage/ImageUploader";
import { Modal } from "@/components/ui/Modal";
import { InfoCard, InfoCardItem } from "@/components/ui/InfoCard";
import { FormField } from "@/components/form/FormField";
import { SelectField } from "@/components/form/SelectField";
import { ActionButtons } from "@/components/form/ActionButtons";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { useNotificationStore } from "@/stores";
import { getMyInfo, updateMyInfo } from "@/services/staffService";
import type { StaffProfile } from "@/types/StaffType/StaffProfile";

export function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    dob: "",
    gender: "MALE" as "MALE" | "FEMALE" | "OTHER",
    avatarUrl: "",
  });

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await getMyInfo();
      console.log("Profile data:", data);

      setProfile(data);

      // Update form data
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        address: data.address || "",
        dob: data.dob || "",
        gender: data.gender || "MALE",
        avatarUrl: data.avatarUrl || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Cannot load profile information. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarClick = () => {
    setShowImageUploader(true);
  };

  const handleUploadSuccess = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      avatarUrl: url,
    }));
    setShowImageUploader(false);
    addNotification({
      type: "success",
      title: "Success",
      message: "Avatar uploaded successfully!",
      duration: 3000,
    });
    console.log("Avatar uploaded successfully:", url);
  };

  // Save profile changes
  const handleSave = async () => {
    if (!profile?.staffId) {
      addNotification({
        type: "error",
        title: "Error",
        message: "Not found staff information!",
        duration: 5000,
      });
      return;
    }

    try {
      setIsSaving(true);

      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        gender: formData.gender,
        dob: formData.dob,
        avatarUrl: formData.avatarUrl || undefined,
      };

      await updateMyInfo(profile.staffId, updateData);

      addNotification({
        type: "success",
        title: "Success",
        message: "Profile updated successfully!",
        duration: 3000,
      });
      setIsEditing(false);
      // Refresh profile data
      await fetchProfile();
    } catch (err) {
      console.error("Error updating profile:", err);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to update profile. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getFullName = () => {
    return `${formData.firstName} ${formData.lastName}`.trim() || "User";
  };

  const getRoleName = () => {
    if (!profile?.roles || profile.roles.length === 0) return "No Role";
    return profile.roles.map((r) => r.name).join(", ");
  };

  const genderOptions = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
  ];

  const getGenderDisplay = () => {
    const option = genderOptions.find((opt) => opt.value === formData.gender);
    return option?.label || formData.gender;
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Profile Settings"
          description="Manage your personal information"
        />

        <ProfileHeader
          avatarUrl={formData.avatarUrl}
          fullName={getFullName()}
          isEditing={isEditing}
          onAvatarClick={handleAvatarClick}
        >
          <ActionButtons
            isEditing={isEditing}
            isSaving={isSaving}
            onEdit={() => setIsEditing(true)}
            onCancel={() => setIsEditing(false)}
            onSave={handleSave}
          />

          {/* Profile Details */}
          <div className="space-y-6">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="First Name"
                icon={User}
                isEditing={isEditing}
                value={formData.firstName}
                name="firstName"
                onChange={handleInputChange}
              />
              <FormField
                label="Last Name"
                icon={User}
                isEditing={isEditing}
                value={formData.lastName}
                name="lastName"
                onChange={handleInputChange}
              />
            </div>

            <FormField
              label="Username"
              icon={User}
              isEditing={false}
              value={profile?.username || "N/A"}
              disabled={true}
              hint="(Cannot be changed)"
            />

            <FormField
              label="Email"
              icon={Mail}
              isEditing={false}
              value={formData.email}
              disabled={true}
              hint="(Cannot be changed)"
            />

            <FormField
              label="Phone Number"
              icon={Phone}
              isEditing={false}
              value={formData.phoneNumber}
              disabled={true}
              hint="(Cannot be changed)"
            />

            <FormField
              label="Address"
              icon={MapPin}
              isEditing={isEditing}
              value={formData.address}
              name="address"
              onChange={handleInputChange}
            />

            <SelectField
              label="Gender"
              isEditing={isEditing}
              value={formData.gender}
              name="gender"
              options={genderOptions}
              onChange={handleInputChange}
              displayValue={getGenderDisplay()}
            />

            <FormField
              label="Date of Birth"
              icon={Calendar}
              isEditing={isEditing}
              value={formData.dob}
              name="dob"
              type="date"
              onChange={handleInputChange}
            >
              {!isEditing && formData.dob && (
                <div className="px-4 py-2 rounded-lg bg-muted text-foreground">
                  {new Date(formData.dob).toLocaleDateString("en-US")}
                </div>
              )}
            </FormField>

            <FormField
              label="Job Title"
              icon={Briefcase}
              isEditing={false}
              value={profile?.jobTitle || "N/A"}
              disabled={true}
            />

            <FormField
              label="Cinema"
              icon={Building2}
              isEditing={false}
              value={profile?.cinemaId || "N/A"}
              disabled={true}
            />

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Role
              </label>
              <div className="px-4 py-2 rounded-lg bg-muted text-foreground">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                  {getRoleName()}
                </span>
              </div>
            </div>
          </div>
        </ProfileHeader>

        <InfoCard title="Account Information">
          <InfoCardItem
            label="Account Type"
            value={
              profile?.accountType === "INTERNAL"
                ? "Internal"
                : profile?.accountType || "N/A"
            }
          />
          <InfoCardItem label="Staff ID" value={profile?.staffId || "N/A"} />
          <InfoCardItem
            label="Account ID"
            value={profile?.accountId || "N/A"}
            valueClassName="text-xs"
          />
          <InfoCardItem
            label="Permissions"
            value={`${
              profile?.roles?.[0]?.permissions?.length || 0
            } permissions`}
          />
        </InfoCard>

        <Modal
          isOpen={showImageUploader}
          onClose={() => setShowImageUploader(false)}
          title="Upload Avatar"
        >
          <ImageUploader onUploadSuccess={handleUploadSuccess} />
        </Modal>
      </div>
    </div>
  );
}
