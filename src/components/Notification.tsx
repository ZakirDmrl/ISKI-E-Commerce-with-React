// src/components/Notification.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

const Notification = () => {
	// Redux store'dan notification state'ini al
	const notification = useSelector((state: RootState) => state.notification);

	if (!notification.message) {
		return null;
	}
	const setBackgroundColor = (type: string | null) => {
		switch (type) {
			case 'success':
				return '#4CAF50';
			case 'error':
				return '#F44336';
			case 'info':
				return '#2196F3';
			default:
				return '#333'; // Varsayılan renk

		}
	};
		// Bildirim tipine göre arka plan rengini belirle
		const backgroundColor = setBackgroundColor(notification.type);



		return (
			<div style={{
				position: 'fixed',
				bottom: '20px',
				right: '20px',
				backgroundColor: backgroundColor, // Renk dinamik olarak ayarlanıyor
				color: 'white',
				padding: '15px',
				borderRadius: '5px',
				boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
				zIndex: 1000,
				minWidth: '250px',
				textAlign: 'center'
			}}>
				{notification.message}
			</div>
		);
	};

	export default Notification;
