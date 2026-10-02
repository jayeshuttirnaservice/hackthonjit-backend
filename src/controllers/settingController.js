import { Setting } from '../models/Setting.js';
import { compressAndSaveImage } from '../utils/imageCompressor.js';

const DEFAULT_UPI_ID = '32488114540@sbi';

/**
 * Fetch current payment QR code & UPI ID setting
 */
export async function getPaymentQR(req, res) {
  try {
    const setting = await Setting.findOne({ key: 'payment_qr' });
    if (!setting || !setting.value) {
      return res.status(200).json({
        success: true,
        data: {
          qrImageUrl: '',
          upiId: DEFAULT_UPI_ID,
          isCustom: false,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        qrImageUrl: setting.value.qrImageUrl || '',
        upiId: setting.value.upiId || DEFAULT_UPI_ID,
        isCustom: !!setting.value.qrImageUrl,
        updatedAt: setting.updatedAt,
      },
    });
  } catch (err) {
    console.error('Error fetching payment QR setting:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve QR code setting',
      error: err.message,
    });
  }
}

/**
 * Update payment QR code image and optional UPI ID from Admin Panel
 */
export async function updatePaymentQR(req, res) {
  try {
    const { qrImage, upiId } = req.body;

    if (!qrImage && !upiId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a new QR image or UPI ID to update.',
      });
    }

    let qrImageUrl = '';
    if (qrImage) {
      if (typeof qrImage === 'string' && qrImage.startsWith('data:')) {
        qrImageUrl = await compressAndSaveImage(qrImage, 'payment-qr');
      } else if (typeof qrImage === 'string' && qrImage.startsWith('/uploads/')) {
        qrImageUrl = qrImage;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid image format. Expected Base64 data URI.',
        });
      }
    }

    const existing = await Setting.findOne({ key: 'payment_qr' });
    const currentVal = existing?.value || {};

    const updatedValue = {
      qrImageUrl: qrImageUrl || currentVal.qrImageUrl || '',
      upiId: (upiId && upiId.trim()) || currentVal.upiId || DEFAULT_UPI_ID,
      updatedAt: new Date(),
    };

    const setting = await Setting.findOneAndUpdate(
      { key: 'payment_qr' },
      { key: 'payment_qr', value: updatedValue },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Payment QR code updated successfully! Main site updated.',
      data: {
        qrImageUrl: setting.value.qrImageUrl,
        upiId: setting.value.upiId,
        isCustom: !!setting.value.qrImageUrl,
        updatedAt: setting.value.updatedAt,
      },
    });
  } catch (err) {
    console.error('Error updating payment QR setting:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update payment QR code',
      error: err.message,
    });
  }
}

/**
 * Reset payment QR back to original default
 */
export async function resetPaymentQR(req, res) {
  try {
    await Setting.deleteOne({ key: 'payment_qr' });
    return res.status(200).json({
      success: true,
      message: 'Reset to default official JIT QR code.',
      data: {
        qrImageUrl: '',
        upiId: DEFAULT_UPI_ID,
        isCustom: false,
      },
    });
  } catch (err) {
    console.error('Error resetting payment QR setting:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset QR code',
      error: err.message,
    });
  }
}
