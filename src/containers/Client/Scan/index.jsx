import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { message, Card, Space, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
import styles from './Scan.module.css';

const Scan = () => {
    const [scanning, setScanning] = useState(true);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                console.error('Auth error:', error);
                message.error('Please login to use the scanner');
                navigate('/login');
                return;
            }
            setUserId(session.user.id);
        };
        
        checkUser();
    }, [navigate]);

    const addItemToInventory = async (qrData) => {
        try {
            console.log('Raw QR Data:', qrData);
            
            // Parse QR code data
            const itemData = JSON.parse(qrData);
            console.log('Parsed Item Data:', itemData);
            
            // Validate required fields
            if (!itemData.ingredient_id) {
                throw new Error('Invalid QR code: Missing ingredient information');
            }

            if (!userId) {
                throw new Error('User not authenticated');
            }

            console.log('Current User ID:', userId);
            
            // Prepare inventory item data
            const inventoryItem = {
                user_id: userId,
                ingredient_id: itemData.ingredient_id,
                quantity: itemData.quantity || 1,
                quantity_unit_id: itemData.quantity_unit_id || 1, // default unit
                created_at: new Date().toISOString(),
                condition_id: 1, // default condition (good)
                days_left: null, // will be calculated based on pred_shelf_life
            };

            console.log('Preparing to insert item:', inventoryItem);

            // Insert into inventory table
            const { data, error } = await supabase
                .from('inventory')
                .insert(inventoryItem)
                .select();

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }

            console.log('Successfully added item:', data[0]);
            return data[0];
        } catch (error) {
            console.error('Error adding item to inventory:', error);
            throw error;
        }
    };

    const handleScan = async (result) => {
        if (result && !loading) {
            try {
                setLoading(true);
                console.log('Scan Result:', result);
                const qrData = result.text;
                
                // Add item to inventory
                await addItemToInventory(qrData);
                
                message.success('Item added to inventory successfully!');
                setScanning(false);
                
                // Navigate to inventory page after successful scan
                navigate('/inventory');
            } catch (error) {
                console.error('Scan Error:', error);
                message.error('Failed to process scan: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleError = (error) => {
        console.error('Camera Error:', error);
        message.error('Error accessing camera: ' + error.message);
    };

    if (!userId) {
        return (
            <div className={styles.scanContainer}>
                <Card>
                    <div className={styles.loadingContainer}>
                        <Spin size="large" />
                        <p>Checking authentication...</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.scanContainer}>
            <Card title="Scan QR Code" className={styles.scanCard}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <Spin size="large" />
                            <p>Processing scan...</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.scannerContainer}>
                                <QrReader
                                    constraints={{
                                        facingMode: 'environment'
                                    }}
                                    onResult={handleScan}
                                    onError={handleError}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <p className={styles.instructionText}>
                                Position the QR code from your receipt within the frame to scan
                            </p>
                        </>
                    )}
                </Space>
            </Card>
        </div>
    );
};

export default Scan;
