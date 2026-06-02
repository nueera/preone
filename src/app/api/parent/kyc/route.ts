// ============================================================
// PreOne — POST /api/parent/kyc
// Upload KYC documents for verification
// Sets kycStatus to PENDING and creates notification for admin
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireParent, isAuthError } from '@/lib/api-auth';
import { db } from '@/lib/db';

// Accepted document types
const ACCEPTED_DOC_TYPES = ['AADHAAR', 'ADDRESS_PROOF', 'PAN', 'PASSPORT', 'VOTER_ID', 'BIRTH_CERTIFICATE', 'OTHER'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    if (isAuthError(auth)) return auth.error;

    const body = await request.json();
    const { documentType, document } = body;

    // Validate document type
    if (!documentType || !ACCEPTED_DOC_TYPES.includes(documentType)) {
      return NextResponse.json(
        { error: `Invalid document type. Accepted types: ${ACCEPTED_DOC_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate document data
    if (!document) {
      return NextResponse.json(
        { error: 'Document data is required' },
        { status: 400 }
      );
    }

    // Check if parent's KYC is already verified — if so, lock documents
    const parent = await db.parent.findUnique({
      where: { id: auth.parent.id },
    });

    if (parent?.kycStatus === 'VERIFIED') {
      return NextResponse.json(
        { error: 'KYC is already verified. Documents cannot be modified.' },
        { status: 400 }
      );
    }

    // In a real implementation, we would:
    // 1. Decode base64 document
    // 2. Validate file size
    // 3. Upload to S3/cloud storage
    // 4. Store the URL
    // For now, we store the base64 data URL as the document reference
    const documentUrl = document.startsWith('data:')
      ? document
      : `data:application/pdf;base64,${document}`;

    // Create KYC document record
    const kycDoc = await db.kycDocument.create({
      data: {
        parentId: auth.parent.id,
        documentType,
        documentUrl,
        status: 'PENDING',
      },
    });

    // Update parent KYC status to PENDING
    await db.parent.update({
      where: { id: auth.parent.id },
      data: {
        kycStatus: 'PENDING',
        kycDoc: documentType, // Store latest doc type for quick reference
        kycRejectionReason: null,
      },
    });

    // Create notification for admin
    try {
      const adminUsers = await db.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        take: 5,
      });

      for (const admin of adminUsers) {
        await db.notification.create({
          data: {
            userId: admin.id,
            title: 'KYC Document Uploaded',
            message: `${auth.parent.firstName} ${auth.parent.lastName} has uploaded a ${documentType.toLowerCase().replace('_', ' ')} document for verification.`,
            type: 'KYC_UPLOAD',
            actionUrl: `/admin/parents/${auth.parent.id}`,
          },
        });
      }
    } catch {
      // Non-critical — don't fail the upload if notification fails
      console.warn('Failed to create admin notification for KYC upload');
    }

    return NextResponse.json({
      message: 'Document uploaded successfully. It will be reviewed by the school admin.',
      document: {
        id: kycDoc.id,
        documentType: kycDoc.documentType,
        status: kycDoc.status,
        createdAt: kycDoc.createdAt,
      },
    });
  } catch (error) {
    console.error('Upload KYC document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
