import Registration from '../models/Registration.js';
import { compressAndSaveImage } from '../utils/imageCompressor.js';
import fs from 'fs';
import path from 'path';

// Helper to generate unique confirmation code
async function generateUniqueConfirmationCode() {
  let isUnique = false;
  let code = '';
  while (!isUnique) {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    code = `#JITHON-${randomDigits}`;
    const existing = await Registration.findOne({ confirmationCode: code });
    if (!existing) {
      isUnique = true;
    }
  }
  return code;
}

// POST /api/register
export async function createRegistration(req, res) {
  try {
    const {
      name,
      email,
      mobile,
      college,
      technologyDomain,
      teamName,
      members,
      transactionId,
      paymentScreenshot,
    } = req.body;

    // Basic Validation
    if (!name || !email || !mobile || !college || !technologyDomain || !teamName) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required primary fields (Name, Email, Mobile, College, Technology/Domain, Team Name).',
      });
    }

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID / UTR number is required for payment verification.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if already registered
    const existingRegistration = await Registration.findOne({ email: normalizedEmail });
    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered for JITHON \'27!',
        data: {
          confCode: existingRegistration.confirmationCode,
          name: existingRegistration.name,
          teamName: existingRegistration.teamName,
          status: existingRegistration.status,
        },
      });
    }

    // Filter members to only those with at least a name
    const validMembers = Array.isArray(members)
      ? members
          .filter((m) => m && m.name && m.name.trim() !== '')
          .map((m) => ({
            name: m.name.trim(),
            email: m.email ? m.email.trim().toLowerCase() : '',
            mobile: m.mobile ? m.mobile.trim() : '',
          }))
      : [];

    const confirmationCode = await generateUniqueConfirmationCode();

    // Compress & physically save screenshot if provided
    let savedScreenshotPath = '';
    if (paymentScreenshot) {
      savedScreenshotPath = await compressAndSaveImage(paymentScreenshot, 'receipt');
    }

    const registration = new Registration({
      name: name.trim(),
      email: normalizedEmail,
      mobile: mobile.trim(),
      college: college.trim(),
      technologyDomain: technologyDomain.trim(),
      teamName: teamName.trim(),
      members: validMembers,
      transactionId: transactionId.trim(),
      paymentScreenshot: savedScreenshotPath,
      status: 'pending',
      confirmationCode,
      venue: 'JIT Campus Labs & Auditorium',
    });

    const saved = await registration.save();

    return res.status(201).json({
      success: true,
      message: 'Registration submitted successfully! It is now pending admin approval.',
      data: {
        id: saved._id,
        name: saved.name,
        email: saved.email,
        teamName: saved.teamName,
        membersCount: saved.members.length,
        transactionId: saved.transactionId,
        confCode: saved.confirmationCode,
        status: saved.status,
        createdAt: saved.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating registration:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An attendee with this email or confirmation code already exists.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing registration',
      error: error.message,
    });
  }
}

// GET /api/registrations (Filtered by status, with search and pagination)
export async function getRegistrations(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const filter = {};

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { teamName: searchRegex },
        { transactionId: searchRegex },
        { college: searchRegex },
        { confirmationCode: searchRegex },
      ];
    }

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Registration.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: registrations,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve registrations',
      error: error.message,
    });
  }
}

// PATCH /api/registrations/:id/approve
export async function approveRegistration(req, res) {
  try {
    const { id } = req.params;
    const updated = await Registration.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Registration for team "${updated.teamName}" approved!`,
      data: updated,
    });
  } catch (error) {
    console.error('Error approving registration:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve registration',
      error: error.message,
    });
  }
}

// PATCH /api/registrations/:id/reject
export async function rejectRegistration(req, res) {
  try {
    const { id } = req.params;
    const updated = await Registration.findByIdAndUpdate(
      id,
      { status: 'rejected' },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Registration for team "${updated.teamName}" marked as rejected.`,
      data: updated,
    });
  } catch (error) {
    console.error('Error rejecting registration:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject registration',
      error: error.message,
    });
  }
}

// DELETE /api/registrations/:id
export async function deleteRegistration(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Registration.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    // Clean up physical file if it exists
    if (deleted.paymentScreenshot && deleted.paymentScreenshot.startsWith('/uploads/')) {
      const physicalPath = path.resolve('.' + deleted.paymentScreenshot);
      if (fs.existsSync(physicalPath)) {
        try {
          fs.unlinkSync(physicalPath);
        } catch (e) {
          console.warn('Could not remove physical file:', e.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Registration deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete registration',
      error: error.message,
    });
  }
}

// GET /api/registrations/stats
export async function getRegistrationStats(req, res) {
  try {
    const [total, pending, approved, rejected, domainAgg] = await Promise.all([
      Registration.countDocuments(),
      Registration.countDocuments({ status: 'pending' }),
      Registration.countDocuments({ status: 'approved' }),
      Registration.countDocuments({ status: 'rejected' }),
      Registration.aggregate([
        { $group: { _id: '$technologyDomain', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
        domains: domainAgg.map((item) => ({
          domain: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching registration stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch registration stats',
      error: error.message,
    });
  }
}
