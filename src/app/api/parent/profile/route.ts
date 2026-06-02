// ============================================================
// PreOne — GET/PATCH /api/parent/profile
// Get and update parent profile information
// PATCH allows updating: phone, email, occupation, address, photo
// Name and relation are read-only (contact admin to change)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireParent, isAuthError } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    // Get full parent data with KYC documents and notification preferences
    const parent = await db.parent.findUnique({
      where: { id: auth.parent.id },
      include: {
        kycDocuments: {
          orderBy: { createdAt: 'desc' },
        },
        notificationPreferences: true,
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      );
    }

    // Get linked children with class info
    const studentParents = await db.studentParent.findMany({
      where: { parentId: parent.id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
            rollNumber: true,
            class: {
              select: {
                id: true,
                name: true,
                program: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    const children = studentParents.map((sp) => ({
      id: sp.student.id,
      firstName: sp.student.firstName,
      lastName: sp.student.lastName,
      photo: sp.student.photo,
      rollNumber: sp.student.rollNumber,
      className: sp.student.class?.name || null,
      programName: sp.student.class?.program?.name || null,
      isPrimary: sp.isPrimary,
    }));

    return NextResponse.json({
      parent: {
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        phone: parent.phone,
        email: parent.email,
        occupation: parent.occupation,
        address: parent.address,
        relation: parent.relation,
        isEmergencyContact: parent.isEmergencyContact,
        photo: parent.photo,
        kycDoc: parent.kycDoc,
        kycStatus: parent.kycStatus,
        kycRejectionReason: parent.kycRejectionReason,
      },
      children,
      kycDocuments: parent.kycDocuments.map((doc) => ({
        id: doc.id,
        documentType: doc.documentType,
        documentUrl: doc.documentUrl,
        status: doc.status,
        reviewedBy: doc.reviewedBy,
        reviewedAt: doc.reviewedAt,
        rejectionReason: doc.rejectionReason,
        createdAt: doc.createdAt,
      })),
      notificationPreferences: parent.notificationPreferences
        ? {
            id: parent.notificationPreferences.id,
            dailyUpdateApp: parent.notificationPreferences.dailyUpdateApp,
            dailyUpdateSms: parent.notificationPreferences.dailyUpdateSms,
            dailyUpdateEmail: parent.notificationPreferences.dailyUpdateEmail,
            observationApp: parent.notificationPreferences.observationApp,
            observationSms: parent.notificationPreferences.observationSms,
            observationEmail: parent.notificationPreferences.observationEmail,
            feeReminderApp: parent.notificationPreferences.feeReminderApp,
            feeReminderSms: parent.notificationPreferences.feeReminderSms,
            feeReminderEmail: parent.notificationPreferences.feeReminderEmail,
            feeOverdueApp: parent.notificationPreferences.feeOverdueApp,
            feeOverdueSms: parent.notificationPreferences.feeOverdueSms,
            feeOverdueEmail: parent.notificationPreferences.feeOverdueEmail,
            attendanceApp: parent.notificationPreferences.attendanceApp,
            attendanceSms: parent.notificationPreferences.attendanceSms,
            attendanceEmail: parent.notificationPreferences.attendanceEmail,
            announcementApp: parent.notificationPreferences.announcementApp,
            announcementSms: parent.notificationPreferences.announcementSms,
            announcementEmail: parent.notificationPreferences.announcementEmail,
            teacherMessageApp: parent.notificationPreferences.teacherMessageApp,
            teacherMessageSms: parent.notificationPreferences.teacherMessageSms,
            teacherMessageEmail: parent.notificationPreferences.teacherMessageEmail,
            leaveStatusApp: parent.notificationPreferences.leaveStatusApp,
            leaveStatusSms: parent.notificationPreferences.leaveStatusSms,
            leaveStatusEmail: parent.notificationPreferences.leaveStatusEmail,
          }
        : null,
    });
  } catch (error) {
    console.error('Get parent profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = ['phone', 'email', 'occupation', 'address', 'photo'];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedParent = await db.parent.update({
      where: { id: auth.parent.id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      parent: {
        id: updatedParent.id,
        firstName: updatedParent.firstName,
        lastName: updatedParent.lastName,
        phone: updatedParent.phone,
        email: updatedParent.email,
        occupation: updatedParent.occupation,
        address: updatedParent.address,
        relation: updatedParent.relation,
        photo: updatedParent.photo,
      },
    });
  } catch (error) {
    console.error('Update parent profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
