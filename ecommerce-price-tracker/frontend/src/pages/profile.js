import React, { useEffect, useRef, useState } from "react";
import API_URL from "../api";
import "./profile.css";

const PROFILE_API = `${API_URL}/api/users`;

function Profile({ user, onLogout }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const displayedImage =
    previewUrl ||
    (profileImage
      ? profileImage.startsWith("http")
        ? profileImage
        : `${API_URL}${profileImage}`
      : "");

  useEffect(() => {
    if (previewUrl) {
      return () => URL.revokeObjectURL(previewUrl);
    }

    return undefined;
  }, [previewUrl]);

  useEffect(() => {
    if (!userId || !token) return undefined;

    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const response = await fetch(`${PROFILE_API}/${encodeURIComponent(userId)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile.");
        }

        const profile = data.user;
        setName(profile.name || "");
        setEmail(profile.email || "");
        setProfileImage(profile.profileImage || "");
        localStorage.setItem("user", JSON.stringify(profile));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Profile loading error:", error);
          setPhotoError(error.message || "Unable to load profile.");
        }
      }
    };

    loadProfile();
    return () => controller.abort();
  }, [userId, token]);

  const handleImageSelection = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setPhotoError("Choose a JPG, PNG, WEBP, or GIF image.");
      setPhotoMessage("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("The image must be 5 MB or smaller.");
      setPhotoMessage("");
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPhotoError("");
    setPhotoMessage("");
  };

  const handleUploadImage = async () => {
    if (!selectedImage || !userId || !token) {
      setPhotoError("Log in and choose an image before saving your photo.");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", selectedImage);
    setPhotoLoading(true);
    setPhotoError("");
    setPhotoMessage("");

    try {
      const response = await fetch(
        `${PROFILE_API}/${encodeURIComponent(userId)}/profile-image`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save profile photo.");
      }

      const updatedUser = data.user;
      setProfileImage(updatedUser.profileImage || "");
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setSelectedImage(null);
      setPreviewUrl("");
      setPhotoMessage("Profile photo saved.");
    } catch (error) {
      console.error("Profile photo upload error:", error);
      setPhotoError(error.message || "Unable to save profile photo.");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!userId || !token) {
      setPhotoError("Log in to remove your saved profile photo.");
      return;
    }

    setPhotoLoading(true);
    setPhotoError("");
    setPhotoMessage("");

    try {
      const response = await fetch(
        `${PROFILE_API}/${encodeURIComponent(userId)}/profile-image`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to remove profile photo.");
      }

      setProfileImage("");
      setSelectedImage(null);
      setPreviewUrl("");
      localStorage.setItem("user", JSON.stringify(data.user));
      setPhotoMessage("Profile photo removed.");
    } catch (error) {
      console.error("Profile photo removal error:", error);
      setPhotoError(error.message || "Unable to remove profile photo.");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSave = () => {
    setEditing(false);
    alert("Profile updated successfully!");
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">
          {displayedImage ? (
            <img src={displayedImage} alt="Profile" />
          ) : (
            "👤"
          )}
        </div>

        {editing && (
          <>
            <div className="profile-photo-actions">
              <input
                ref={fileInputRef}
                className="profile-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageSelection}
              />
              <button
                className="profile-photo-button"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoLoading}
              >
                {profileImage ? "Change photo" : "Upload photo"}
              </button>
              {selectedImage && (
                <>
                  <button
                    className="profile-photo-save"
                    type="button"
                    onClick={handleUploadImage}
                    disabled={photoLoading}
                  >
                    {photoLoading ? "Saving..." : "Save photo"}
                  </button>
                  <button
                    className="profile-photo-cancel"
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setPreviewUrl("");
                      setPhotoError("");
                      setPhotoMessage("");
                    }}
                    disabled={photoLoading}
                  >
                    Cancel
                  </button>
                </>
              )}
              {profileImage && (
                <button
                  className="profile-photo-remove"
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={photoLoading}
                >
                  Remove
                </button>
              )}
            </div>

            {photoError && (
              <p className="profile-photo-error" role="alert">
                {photoError}
              </p>
            )}
            {photoMessage && (
              <p className="profile-photo-message" role="status">
                {photoMessage}
              </p>
            )}
          </>
        )}

        <h1>My Profile</h1>

        <p className="profile-subtitle">
          Manage your PriceTracker account
        </p>

        <div className="profile-info">
          <label>Name</label>
          <input
            type="text"
            value={name}
            disabled={!editing}
            onChange={(e) => setName(e.target.value)}
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            disabled={!editing}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Phone</label>
          <input
            type="tel"
            value={phone}
            disabled={!editing}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="profile-buttons">
          {editing ? (
            <button
              className="save-button"
              onClick={handleSave}
            >
              💾 Save Changes
            </button>
          ) : (
            <button
              className="edit-button"
              onClick={() => setEditing(true)}
            >
              ✏️ Edit Profile
            </button>
          )}

          <button
            className="logout-button"
            onClick={onLogout}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
