// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState, type AppDispatch } from '../store/store';
import { setNotification, clearNotification } from '../store/notificationSlice';
import { supabase } from '../supabaseClient';
import type { Profile } from '../types';

const ProfilePage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [editMode, setEditMode] = useState(false);
    
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
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (error) throw error;

            setProfile(data);
            setFullName(data.full_name || '');
            setUsername(data.username || '');
            setAvatarPreview(data.avatar_url || null);
        } catch (error: any) {
            console.error('Profile load error:', error);
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
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error: any) {
            console.error('Avatar upload error:', error);
            return null;
        }
    };

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
                    throw new Error('Avatar yüklenirken hata oluştu');
                }
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName.trim() || null,
                    username: username.trim() || null,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;

            dispatch(setNotification({
                message: 'Profil başarıyla güncellendi!',
                type: 'success'
            }));
            
            setEditMode(false);
            setAvatarFile(null);
            await loadProfile(); // Reload profile data
            
        } catch (error: any) {
            console.error('Profile update error:', error);
            dispatch(setNotification({
                message: `Profil güncellenirken hata oluştu: ${error.message}`,
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

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid #333',
                    borderTop: '4px solid #007bff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ color: '#fff', fontSize: '1.2rem' }}>Profil yükleniyor...</p>
            </div>
        );
    }

    return (
        <div style={{
            width: '100%',
            padding: '0'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '30px',
                marginBottom: '25px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    margin: '0',
                    background: 'linear-gradient(45deg, #fff, #e0e0e0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    Profil Ayarları
                </h1>
                <p style={{
                    fontSize: '1rem',
                    opacity: 0.9,
                    margin: '8px 0 0 0',
                    color: '#fff'
                }}>
                    Hesap bilgilerinizi düzenleyebilirsiniz
                </p>
            </div>

            {/* Profile Card */}
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '30px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
                {/* Avatar Section */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '25px'
                }}>
                    <div style={{
                        position: 'relative',
                        marginBottom: '15px'
                    }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: avatarPreview 
                                ? `url(${avatarPreview}) center/cover`
                                : 'linear-gradient(45deg, #667eea, #764ba2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            border: '4px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                        }}>
                            {!avatarPreview && (user?.email?.charAt(0).toUpperCase() || '?')}
                        </div>
                        
                        {editMode && (
                            <label style={{
                                position: 'absolute',
                                bottom: '10px',
                                right: '10px',
                                background: '#007bff',
                                color: 'white',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(0,123,255,0.4)',
                                transition: 'all 0.3s ease'
                            }}>
                                📷
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        )}
                    </div>

                    {avatarFile && (
                        <p style={{
                            color: '#4CAF50',
                            fontSize: '0.9rem',
                            margin: 0
                        }}>
                            Yeni avatar seçildi: {avatarFile.name}
                        </p>
                    )}
                </div>

                {/* Profile Information */}
                <div style={{
                    display: 'grid',
                    gap: '20px',
                    marginBottom: '25px'
                }}>
                    {/* Email (Read-only) */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            E-posta
                        </label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            style={{
                                width: '100%',
                                padding: '15px 20px',
                                fontSize: '1rem',
                                borderRadius: '12px',
                                border: '2px solid rgba(255,255,255,0.1)',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                color: '#ccc',
                                outline: 'none',
                                cursor: 'not-allowed'
                            }}
                        />
                        <small style={{ color: '#888', fontSize: '0.85rem' }}>
                            E-posta adresi değiştirilemez
                        </small>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            Ad Soyad
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={!editMode}
                            placeholder="Ad ve soyadınızı girin"
                            style={{
                                width: '100%',
                                padding: '15px 20px',
                                fontSize: '1rem',
                                borderRadius: '12px',
                                border: `2px solid ${editMode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                backgroundColor: editMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                cursor: editMode ? 'text' : 'not-allowed'
                            }}
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label style={{
                            display: 'block',
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            Kullanıcı Adı
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            disabled={!editMode}
                            placeholder="Kullanıcı adınızı girin"
                            style={{
                                width: '100%',
                                padding: '15px 20px',
                                fontSize: '1rem',
                                borderRadius: '12px',
                                border: `2px solid ${editMode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                backgroundColor: editMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                cursor: editMode ? 'text' : 'not-allowed'
                            }}
                        />
                        <small style={{ color: '#888', fontSize: '0.85rem' }}>
                            Sadece küçük harf, rakam ve alt çizgi kullanılabilir
                        </small>
                    </div>

                    {/* Account Info */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px',
                        marginTop: '10px'
                    }}>
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#fff',
                                fontSize: '1rem',
                                fontWeight: '600',
                                marginBottom: '8px'
                            }}>
                                Üyelik Tarihi
                            </label>
                            <div style={{
                                padding: '15px 20px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                color: '#ccc',
                                fontSize: '1rem'
                            }}>
                                {profile?.created_at 
                                    ? new Date(profile.created_at).toLocaleDateString('tr-TR')
                                    : 'Bilinmiyor'
                                }
                            </div>
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                color: '#fff',
                                fontSize: '1rem',
                                fontWeight: '600',
                                marginBottom: '8px'
                            }}>
                                Son Güncelleme
                            </label>
                            <div style={{
                                padding: '15px 20px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                color: '#ccc',
                                fontSize: '1rem'
                            }}>
                                {profile?.updated_at 
                                    ? new Date(profile.updated_at).toLocaleDateString('tr-TR')
                                    : 'Hiç'
                                }
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '15px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    {!editMode ? (
                        <button
                            onClick={() => setEditMode(true)}
                            style={{
                                padding: '15px 30px',
                                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                            }}
                        >
                            Profili Düzenle
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleUpdateProfile}
                                disabled={updating}
                                style={{
                                    padding: '15px 30px',
                                    background: updating 
                                        ? 'rgba(76, 175, 80, 0.6)' 
                                        : 'linear-gradient(45deg, #4CAF50, #45a049)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: updating ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!updating) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.6)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!updating) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.4)';
                                    }
                                }}
                            >
                                {updating ? 'Güncelleniyor...' : 'Kaydet'}
                            </button>

                            <button
                                onClick={cancelEdit}
                                disabled={updating}
                                style={{
                                    padding: '15px 30px',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: updating ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!updating) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!updating) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                İptal
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
