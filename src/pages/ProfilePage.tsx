// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState, type AppDispatch } from '../store/store';
import { setNotification, clearNotification } from '../store/notificationSlice';
import type { Profile } from '../types';
import { apiClient } from '../config/api';

const ProfilePage: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { user } = useSelector((state: RootState) => state.auth);

	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [editMode, setEditMode] = useState(false);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);

	// Form states
	const [fullName, setFullName] = useState('');
	const [username, setUsername] = useState('');
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

	// Load profile data
	useEffect(() => {
		if (user?.id) {
			loadProfile();
		}
	}, [user?.id]);

	const loadProfile = async () => {
		try {
			setLoading(true);
			const response = await apiClient.get('/profile');

			const profileData = response.data.profile;
			setProfile(profileData);
			setFullName(profileData.full_name || '');
			setUsername(profileData.username || '');
			setAvatarPreview(profileData.avatar_url || null);
		} catch (error) {
			dispatch(setNotification({
				message: 'Profil bilgileri yüklenirken hata oluştu.',
				type: 'error'
			}));
			setTimeout(() => dispatch(clearNotification()), 3000);
		} finally {
			setLoading(false);
		}
	};

	const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			// File size validation (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				dispatch(setNotification({
					message: 'Dosya boyutu çok büyük. Maksimum 5MB olmalıdır.',
					type: 'error'
				}));
				setTimeout(() => dispatch(clearNotification()), 3000);
				return;
			}

			// File type validation
			if (!file.type.startsWith('image/')) {
				dispatch(setNotification({
					message: 'Lütfen geçerli bir resim dosyası seçin.',
					type: 'error'
				}));
				setTimeout(() => dispatch(clearNotification()), 3000);
				return;
			}

			setAvatarFile(file);
			const reader = new FileReader();
			reader.onload = (e) => {
				setAvatarPreview(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const uploadAvatar = async (file: File): Promise<string | null> => {
		try {
			setUploadingAvatar(true);

			const formData = new FormData();
			formData.append('avatar', file);

			const response = await apiClient.post('/profile/avatar', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				}
			});

			return response.data.avatar_url;
		} catch (error) {
			dispatch(setNotification({
				message: 'Avatar yüklenirken hata oluştu: ' + (error.response?.data?.error || error.message),
				type: 'error'
			}));
			setTimeout(() => dispatch(clearNotification()), 3000);
			return null;
		} finally {
			setUploadingAvatar(false);
		}
	};

	// handleUpdateProfile fonksiyonu - avatar upload kısmını aktif et
	const handleUpdateProfile = async () => {
		if (!user?.id) return;

		try {
			setUpdating(true);

			let avatarUrl = profile?.avatar_url;

			// Upload new avatar if selected
			if (avatarFile) {
				const uploadedUrl = await uploadAvatar(avatarFile);
				if (uploadedUrl) {
					avatarUrl = uploadedUrl;
				} else {
					return; // Upload failed, error already shown
				}
			}

			// Backend'e profile update isteği
			const updateData = {
				full_name: fullName.trim() || null,
				username: username.trim() || null,
				avatar_url: avatarUrl
			};

			const response = await apiClient.put('/profile', updateData);

			if (response.status === 200) {
				dispatch(setNotification({
					message: 'Profil başarıyla güncellendi!',
					type: 'success'
				}));

				setEditMode(false);
				setAvatarFile(null);
				await loadProfile();
			}

		} catch (error) {
			dispatch(setNotification({
				message: `Profil güncellenirken hata oluştu: ${error.response?.data?.error || error.message}`,
				type: 'error'
			}));
		} finally {
			setUpdating(false);
			setTimeout(() => dispatch(clearNotification()), 3000);
		}
	};

	const cancelEdit = () => {
		setEditMode(false);
		setFullName(profile?.full_name || '');
		setUsername(profile?.username || '');
		setAvatarFile(null);
		setAvatarPreview(profile?.avatar_url || null);
	};

	const generateDefaultAvatar = (email: string, size: number) => {
		const colors = [
			'#667eea', '#764ba2', '#f093fb', '#f5576c',
			'#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
			'#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
		];

		const initial = email?.charAt(0).toUpperCase() || '?';
		const backgroundColor = colors[email?.length % colors.length || 0];

		return (
			<div
				className="default-avatar"
				style={{
					width: size,
					height: size,
					backgroundColor,
					borderRadius: '50%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: 'white',
					fontSize: `${size * 0.4}px`,
					fontWeight: '700',
					border: '4px solid rgba(255,255,255,0.2)',
					boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
				}}
			>
				{initial}
			</div>
		);
	};

	if (loading) {
		return (
			<div className="loading-container">
				<div className="loading-content">
					<div className="loading-spinner"></div>
					<p>Profil yükleniyor...</p>
				</div>
				<style>{`
                    .loading-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 60vh;
                        flex-direction: column;
                        gap: 20px;
                    }
                    .loading-content {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 20px;
                    }
                    .loading-spinner {
                        width: 50px;
                        height: 50px;
                        border: 4px solid #333;
                        border-top: 4px solid #007bff;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    .loading-content p {
                        color: #fff;
                        font-size: 1.2rem;
                        margin: 0;
                    }
                `}</style>
			</div>
		);
	}

	return (
		<div className="profile-page">
			{/* Header */}
			<div className="profile-header">
				<h1 className="header-title">Profil Ayarları</h1>
				<p className="header-subtitle">
					Hesap bilgilerinizi düzenleyebilirsiniz
				</p>
			</div>

			{/* Profile Card */}
			<div className="profile-card">
				{/* Avatar Section */}
				<div className="avatar-section">
					<div className="avatar-container">
						{avatarPreview ? (
							<img
								src={avatarPreview}
								alt="Profile Avatar"
								className="avatar-image"
							/>
						) : (
							generateDefaultAvatar(user?.email || '', 120)
						)}

						{editMode && (
							<label className="avatar-upload-btn">
								{uploadingAvatar ? (
									<div className="upload-spinner"></div>
								) : (
									<span>📷</span>
								)}
								<input
									type="file"
									accept="image/*"
									onChange={handleAvatarChange}
									style={{ display: 'none' }}
									disabled={uploadingAvatar}
								/>
							</label>
						)}

						{uploadingAvatar && (
							<div className="upload-overlay">
								<div className="upload-progress">Yükleniyor...</div>
							</div>
						)}
					</div>

					{avatarFile && (
						<div className="file-selected">
							✅ Yeni avatar seçildi: {avatarFile.name}
						</div>
					)}

					{editMode && !uploadingAvatar && (
						<div className="avatar-help">
							📷 Profil resminizi değiştirmek için tıklayın (Max: 5MB)
						</div>
					)}
				</div>

				{/* Profile Form */}
				<div className="profile-form">
					{/* Email (Read-only) */}
					<div className="form-group">
						<label className="form-label">
							📧 E-posta
						</label>
						<input
							type="email"
							value={user?.email || ''}
							disabled
							className="form-input disabled"
						/>
						<small className="form-help">
							E-posta adresi değiştirilemez
						</small>
					</div>

					{/* Full Name */}
					<div className="form-group">
						<label className="form-label">
							👤 Ad Soyad
						</label>
						<input
							type="text"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
							disabled={!editMode}
							placeholder="Ad ve soyadınızı girin"
							className={`form-input ${editMode ? 'editable' : 'disabled'}`}
						/>
					</div>

					{/* Username */}
					<div className="form-group">
						<label className="form-label">
							🏷️ Kullanıcı Adı
						</label>
						<input
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
							disabled={!editMode}
							placeholder="Kullanıcı adınızı girin"
							className={`form-input ${editMode ? 'editable' : 'disabled'}`}
						/>
						<small className="form-help">
							Sadece küçük harf, rakam ve alt çizgi kullanılabilir
						</small>
					</div>

					{/* Account Info */}
					<div className="info-grid">
						<div className="info-item">
							<label className="form-label">
								📅 Üyelik Tarihi
							</label>
							<div className="info-value">
								{profile?.created_at
									? new Date(profile.created_at).toLocaleDateString('tr-TR')
									: 'Bilinmiyor'
								}
							</div>
						</div>

						<div className="info-item">
							<label className="form-label">
								🔄 Son Güncelleme
							</label>
							<div className="info-value">
								{profile?.updated_at
									? new Date(profile.updated_at).toLocaleDateString('tr-TR')
									: 'Hiç'
								}
							</div>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="action-buttons">
					{!editMode ? (
						<button
							onClick={() => setEditMode(true)}
							className="btn-primary"
						>
							✏️ Profili Düzenle
						</button>
					) : (
						<>
							<button
								onClick={handleUpdateProfile}
								disabled={updating || uploadingAvatar}
								className={`btn-success ${(updating || uploadingAvatar) ? 'loading' : ''}`}
							>
								{updating ? '⏳ Güncelleniyor...' : '💾 Kaydet'}
							</button>

							<button
								onClick={cancelEdit}
								disabled={updating || uploadingAvatar}
								className="btn-cancel"
							>
								❌ İptal
							</button>
						</>
					)}
				</div>
			</div>

			<style>{`
                .profile-page {
                    width: 100%;
                    padding: 0;
                    min-height: calc(100vh - 120px);
                }

                .profile-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 16px;
                    padding: clamp(1.5rem, 4vw, 2rem);
                    margin: 1rem;
                    margin-bottom: 2rem;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                }

                .header-title {
                    font-size: clamp(1.5rem, 4vw, 2rem);
                    font-weight: 700;
                    margin: 0;
                    background: linear-gradient(45deg, #fff, #e0e0e0);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .header-subtitle {
                    font-size: clamp(0.9rem, 2vw, 1rem);
                    opacity: 0.9;
                    margin: 0.5rem 0 0 0;
                    color: #fff;
                }

                .profile-card {
                    background: rgba(255,255,255,0.05);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: clamp(1.5rem, 4vw, 2rem);
                    margin: 1rem;
                    border: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }

                /* Avatar Section */
                .avatar-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 2rem;
                    gap: 1rem;
                }

                .avatar-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .avatar-image {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 4px solid rgba(255,255,255,0.2);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    transition: all 0.3s ease;
                }

                .avatar-upload-btn {
                    position: absolute;
                    bottom: 5px;
                    right: 5px;
                    background: linear-gradient(45deg, #007bff, #0056b3);
                    color: white;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(0,123,255,0.4);
                    transition: all 0.3s ease;
                    font-size: 1rem;
                }

                .avatar-upload-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(0,123,255,0.6);
                }

                .upload-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .upload-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.7);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(5px);
                }

                .upload-progress {
                    color: white;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .file-selected {
                    color: #4CAF50;
                    font-size: 0.9rem;
                    text-align: center;
                    padding: 0.5rem 1rem;
                    background: rgba(76,175,80,0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(76,175,80,0.3);
                }

                .avatar-help {
                    color: #ccc;
                    font-size: 0.85rem;
                    text-align: center;
                    background: rgba(255,255,255,0.05);
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                /* Profile Form */
                .profile-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-label {
                    color: #fff;
                    font-size: 1rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .form-input {
                    width: 100%;
                    padding: 1rem 1.25rem;
                    font-size: 1rem;
                    border-radius: 12px;
                    border: 2px solid;
                    background-color: rgba(255,255,255,0.05);
                    color: #fff;
                    outline: none;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .form-input.disabled {
                    border-color: rgba(255,255,255,0.1);
                    cursor: not-allowed;
                    color: #ccc;
                }

                .form-input.editable {
                    border-color: rgba(255,255,255,0.3);
                    background-color: rgba(255,255,255,0.1);
                }

                .form-input.editable:focus {
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
                    background-color: rgba(255,255,255,0.15);
                }

                .form-input::placeholder {
                    color: rgba(255,255,255,0.5);
                }

                .form-help {
                    color: #999;
                    font-size: 0.85rem;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    margin-top: 1rem;
                }

                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .info-value {
                    padding: 1rem 1.25rem;
                    border-radius: 12px;
                    background-color: rgba(255,255,255,0.05);
                    color: #ccc;
                    font-size: 1rem;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                /* Action Buttons */
                .action-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .btn-primary,
                .btn-success,
                .btn-cancel {
                    padding: 1rem 2rem;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    min-width: 150px;
                    justify-content: center;
                }

                .btn-primary {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    color: white;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
                }

                .btn-success {
                    background: linear-gradient(45deg, #4CAF50, #45a049);
                    color: white;
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
                }

                .btn-success:hover:not(.loading) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(76, 175, 80, 0.6);
                }

                .btn-success.loading {
                    background: rgba(76, 175, 80, 0.6);
                    cursor: not-allowed;
                }

                .btn-cancel {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    border: 2px solid rgba(255,255,255,0.2);
                    box-shadow: none;
                }

                .btn-cancel:hover:not(:disabled) {
                    background: rgba(255,255,255,0.2);
                    transform: translateY(-2px);
                }

                .btn-cancel:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .profile-header {
                        margin: 0.5rem;
                        border-radius: 12px;
                    }

                    .profile-card {
                        margin: 0.5rem;
                        padding: 1.5rem;
                        border-radius: 12px;
                    }

                    .avatar-image,
                    .default-avatar {
                        width: 100px;
                        height: 100px;
                    }

                    .avatar-upload-btn {
                        width: 35px;
                        height: 35px;
                        font-size: 0.9rem;
                    }

                    .info-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }

                    .action-buttons {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .btn-primary,
                    .btn-success,
                    .btn-cancel {
                        min-width: auto;
                        width: 100%;
                    }
                }

                @media (max-width: 480px) {
                    .profile-card {
                        padding: 1rem;
                    }

                    .avatar-image,
                    .default-avatar {
                        width: 80px;
                        height: 80px;
                    }

                    .avatar-upload-btn {
                        width: 30px;
                        height: 30px;
                        font-size: 0.8rem;
                    }

                    .form-input,
                    .info-value {
                        padding: 0.75rem 1rem;
                        font-size: 0.9rem;
                    }

                    .btn-primary,
                    .btn-success,
                    .btn-cancel {
                        padding: 0.75rem 1.5rem;
                        font-size: 0.9rem;
                    }
                }

                /* High DPI adjustments */
                @media (min-resolution: 150dpi) {
                    .profile-card {
                        padding: 2.5rem;
                    }
                    
                    .avatar-image,
                    .default-avatar {
                        width: 140px;
                        height: 140px;
                    }
                    
                    .form-input,
                    .info-value {
                        padding: 1.2rem 1.5rem;
                    }
                }

                /* Animations */
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Loading states */
                .loading-spinner {
                    animation: spin 1s linear infinite;
                }

                .upload-spinner {
                    animation: spin 1s linear infinite;
                }
            `}</style>
		</div>
	);
};

export default ProfilePage;
