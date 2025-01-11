import React, { useState, useEffect } from 'react';
import QrScanner from 'react-qr-scanner';
import { message, Card, Space, Spin, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
import styles from './Scan.module.css';

const Scan = () => {
    const [scanning, setScanning] = useState(true);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);
    const [facingMode, setFacingMode] = useState('environment');
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

    const handleScan = async (data) => {
        if (data && !loading) {
            try {
                setLoading(true);
                console.log('Scan Result:', data);
                
                // Validate JSON format
                try {
                    JSON.parse(data.text);
                } catch (e) {
                    throw new Error('Invalid QR code format. Expected JSON data.');
                }
                
                // Add item to inventory
                await addItemToInventory(data.text);
                
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
        if (error?.name !== 'NotFoundException') {
            console.error('Camera Error:', error);
            if (error?.name === 'NotAllowedError') {
                message.error('Please allow camera access to use the scanner');
            } else if (error?.name === 'NotFoundError') {
                message.error('No camera found on your device');
            } else if (error?.name === 'NotReadableError') {
                message.error('Unable to access camera. Please check if another app is using it');
            } else {
                message.error('Error accessing camera: ' + error.message);
            }
        }
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const addItemToInventory = async (qrData) => {
        try {
            console.log('Raw QR Data:', qrData);
            
            // Parse QR code data
            const data = JSON.parse(qrData);
            console.log('Parsed Receipt Data:', data);
            
            // Validate store name
            if (data.store.name !== "SuperMart Grocery") {
                throw new Error('Invalid receipt: Not from SuperMart Grocery');
            }

            if (!userId) {
                throw new Error('User not authenticated');
            }

            console.log('Current User ID:', userId);
            
            // Process each item in the receipt
            const insertPromises = data.receipt.items.map(async (item) => {
                // Get ingredient details from ingredients table
                const { data: ingredientData, error: ingredientError } = await supabase
                    .from('ingredients')
                    .select('*')
                    .eq('id', item.id)
                    .single();

                if (ingredientError) {
                    console.error('Error fetching ingredient:', ingredientError);
                    throw new Error(`Invalid ingredient ID: ${item.id}`);
                }

                // Calculate days_left based on pred_shelf_life if available
                let days_left = null;
                if (ingredientData.pred_shelf_life) {
                    // Convert pred_shelf_life to days if it's in a different format
                    // Assuming pred_shelf_life is in days format already
                    days_left = parseInt(ingredientData.pred_shelf_life);
                }

                // Prepare inventory item data
                const inventoryItem = {
                    user_id: userId,
                    ingredient_id: item.id,
                    quantity: item.quantity,
                    quantity_unit_id: ingredientData.quantity_unit_id, // Use the unit from ingredients table
                    created_at: new Date().toISOString(),
                    condition_id: 1, // default condition (good)
                    days_left: days_left,
                    init_quantity: item.quantity // Store original quantity
                };

                console.log('Preparing to insert item:', inventoryItem);

                // Insert into inventory table
                const { data: insertedData, error: insertError } = await supabase
                    .from('inventory')
                    .insert(inventoryItem)
                    .select();

                if (insertError) {
                    console.error('Supabase Error:', insertError);
                    throw insertError;
                }

                console.log('Successfully added item:', insertedData[0]);
                return insertedData[0];
            });

            // Wait for all items to be inserted
            const results = await Promise.all(insertPromises);
            return results;
        } catch (error) {
            console.error('Error adding items to inventory:', error);
            throw error;
        }
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
                                <QrScanner
                                    delay={300}
                                    onError={handleError}
                                    onScan={handleScan}
                                    constraints={{
                                        video: { facingMode }
                                    }}
                                    style={{
                                        width: '100%',
                                        maxWidth: '500px'
                                    }}
                                />
                            </div>
                            <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                <Button onClick={toggleCamera}>
                                    Switch Camera ({facingMode === 'environment' ? 'Back' : 'Front'})
                                </Button>
                            </div>
                            <p className={styles.instructionText}>
                                Hold your QR code steady in front of the camera. Make sure there's good lighting and the code is clear.
                            </p>
                        </>
                    )}
                </Space>
            </Card>
        </div>
    );
};

export default Scan;
