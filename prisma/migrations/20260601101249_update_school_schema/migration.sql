/*
  Warnings:

  - You are about to drop the column `actionSuggested` on the `AIObservation` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `AIObservation` table. All the data in the column will be lost.
  - You are about to drop the column `confidence` on the `AIObservation` table. All the data in the column will be lost.
  - You are about to drop the column `isReviewed` on the `AIObservation` table. All the data in the column will be lost.
  - You are about to drop the column `modelVersion` on the `AIObservation` table. All the data in the column will be lost.
  - You are about to drop the column `observation` on the `AIObservation` table. All the data in the column will be lost.
  - You are about to drop the column `recommendation` on the `AIObservation` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `AIObservation` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `AIObservation` table. All the data in the column will be lost.
  - You are about to drop the column `sourceData` on the `AIObservation` table. All the data in the column will be lost.
  - You are about to drop the column `teacherFeedback` on the `AIObservation` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `AIObservation` table. All the data in the column will be lost.
  - You are about to drop the column `awardedBy` on the `Achievement` table. All the data in the column will be lost.
  - You are about to drop the column `badgeColor` on the `Achievement` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Achievement` table. All the data in the column will be lost.
  - You are about to drop the column `mediaUrl` on the `Achievement` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Achievement` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `sectionId` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `targetAudience` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `changes` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `pincode` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `certificateNo` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `expiryDate` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `issuedBy` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `issuedDate` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Certificate` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ChatParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `isMuted` on the `ChatParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `lastReadAt` on the `ChatParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ChatParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `ChatThread` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `ChatThread` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessage` on the `ChatThread` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessageAt` on the `ChatThread` table. All the data in the column will be lost.
  - You are about to drop the column `academicYear` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `floor` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `afternoonMood` on the `DailyUpdate` table. All the data in the column will be lost.
  - You are about to drop the column `foodNotes` on the `DailyUpdate` table. All the data in the column will be lost.
  - You are about to drop the column `moodNotes` on the `DailyUpdate` table. All the data in the column will be lost.
  - You are about to drop the column `morningMood` on the `DailyUpdate` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `DailyUpdate` table. All the data in the column will be lost.
  - You are about to drop the column `pottyNotes` on the `DailyUpdate` table. All the data in the column will be lost.
  - You are about to drop the column `sleepDuration` on the `DailyUpdate` table. All the data in the column will be lost.
  - You are about to drop the column `sleepNotes` on the `DailyUpdate` table. All the data in the column will be lost.
  - You are about to drop the column `waterNotes` on the `DailyUpdate` table. All the data in the column will be lost.
  - You are about to drop the column `alternatePhone` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `backgroundVerified` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `backgroundVerifiedAt` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `bloodGroup` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `dob` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContact` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `photo` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `isAllDay` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `isRecurring` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `media` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `organizer` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `recurrencePattern` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `targetAudience` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `deliveredAt` on the `FeeReminder` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `FeeReminder` table. All the data in the column will be lost.
  - You are about to drop the column `reminderType` on the `FeeReminder` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `FeeReminder` table. All the data in the column will be lost.
  - You are about to drop the column `academicYear` on the `FeeStructure` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `FeeStructure` table. All the data in the column will be lost.
  - You are about to drop the column `discountPercent` on the `FeeStructure` table. All the data in the column will be lost.
  - You are about to drop the column `dueDay` on the `FeeStructure` table. All the data in the column will be lost.
  - You are about to drop the column `feeType` on the `FeeStructure` table. All the data in the column will be lost.
  - You are about to drop the column `lateFeeMax` on the `FeeStructure` table. All the data in the column will be lost.
  - You are about to drop the column `lateFeePerDay` on the `FeeStructure` table. All the data in the column will be lost.
  - You are about to drop the column `conductedBy` on the `FollowUp` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `FollowUp` table. All the data in the column will be lost.
  - You are about to drop the column `followUpDate` on the `FollowUp` table. All the data in the column will be lost.
  - You are about to drop the column `nextFollowUpDate` on the `FollowUp` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `FollowUp` table. All the data in the column will be lost.
  - You are about to drop the column `assessmentDate` on the `GrowthScore` table. All the data in the column will be lost.
  - You are about to drop the column `socialSkills` on the `GrowthScore` table. All the data in the column will be lost.
  - You are about to alter the column `cognitive` on the `GrowthScore` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `communication` on the `GrowthScore` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `confidence` on the `GrowthScore` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `creativity` on the `GrowthScore` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `physical` on the `GrowthScore` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to drop the column `branchId` on the `Holiday` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Holiday` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Holiday` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Holiday` table. All the data in the column will be lost.
  - You are about to drop the column `isRecurring` on the `Holiday` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Holiday` table. All the data in the column will be lost.
  - You are about to drop the column `academicYear` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `cancellationReason` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledAt` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `discountReason` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `issuedAt` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `lateFee` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `paidAmount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `childDob` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `childGender` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedFee` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `expectedEnrollmentDate` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `interactionCount` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `nextFollowUpDate` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `parentAddress` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `parentOccupation` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `sourceDetail` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `document` on the `Leave` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `Leave` table. All the data in the column will be lost.
  - You are about to drop the column `totalDays` on the `Leave` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Leave` table. All the data in the column will be lost.
  - You are about to drop the column `attachments` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `hospital` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `recordType` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `MedicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Memory` table. All the data in the column will be lost.
  - You are about to drop the column `isFavorite` on the `Memory` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `Memory` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `Memory` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailUrl` on the `Memory` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Memory` table. All the data in the column will be lost.
  - You are about to drop the column `attachment` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `messageType` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `ageRange` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the column `indicators` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the column `maxAgeMonths` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the column `minAgeMonths` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `MilestoneTimeline` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `MilestoneTimeline` table. All the data in the column will be lost.
  - You are about to drop the column `mediaUrl` on the `MilestoneTimeline` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `MilestoneTimeline` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `MilestoneTimeline` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedBy` on the `MilestoneTimeline` table. All the data in the column will be lost.
  - You are about to drop the column `channel` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `deliveredAt` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `sentAt` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Observation` table. All the data in the column will be lost.
  - You are about to drop the column `parentAcknowledged` on the `Observation` table. All the data in the column will be lost.
  - You are about to drop the column `sharedAt` on the `Observation` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Otp` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Otp` table. All the data in the column will be lost.
  - You are about to drop the column `alternatePhone` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `isPrimary` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `kycDocImage` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `kycDocNumber` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `kycDocType` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `kycVerifiedAt` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `photo` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `chequeDate` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paidBy` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paidByName` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `receivedBy` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `areasOfImprovement` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `goals` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `professionalism` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerId` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `strengths` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to alter the column `communication` on the `PerformanceReview` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `studentEngagement` on the `PerformanceReview` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `teachingQuality` on the `PerformanceReview` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to drop the column `actualTime` on the `PickupDrop` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `PickupDrop` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `PickupDrop` table. All the data in the column will be lost.
  - You are about to drop the column `photo` on the `PickupDrop` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledTime` on the `PickupDrop` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `PickupDrop` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PickupDrop` table. All the data in the column will be lost.
  - You are about to drop the column `verificationCode` on the `PickupDrop` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedBy` on the `PickupDrop` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `maxAge` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `minAge` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `issuedAt` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `issuedBy` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `Refund` table. All the data in the column will be lost.
  - You are about to drop the column `processedBy` on the `Refund` table. All the data in the column will be lost.
  - You are about to drop the column `transactionRef` on the `Refund` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Refund` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `error` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `format` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `generatedAt` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `parameters` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `endLocation` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedTime` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `eveningStartTime` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `morningStartTime` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `startLocation` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `basicPay` on the `SalaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `esiDeduction` on the `SalaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `grossPay` on the `SalaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `otherAllowances` on the `SalaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `paidOn` on the `SalaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `totalAllowances` on the `SalaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `totalDeductions` on the `SalaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `transactionRef` on the `SalaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `transportAllowance` on the `SalaryRecord` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `SalaryRecord` table. All the data in the column will be lost.
  - You are about to alter the column `month` on the `SalaryRecord` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to drop the column `description` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `ownerEmail` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `ownerName` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `ownerPhone` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `tagline` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `capacity` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Sibling` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Sibling` table. All the data in the column will be lost.
  - You are about to drop the column `checkInLat` on the `StaffAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkInLng` on the `StaffAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkOutLat` on the `StaffAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkOutLng` on the `StaffAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `StaffAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `StaffAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `workingHours` on the `StaffAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `admissionNo` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContact` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `enrollmentDate` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `sectionId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `checkInLat` on the `StudentAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkInLng` on the `StudentAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkOutLat` on the `StudentAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkOutLng` on the `StudentAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `StudentAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `StudentAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `StudentParent` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `StudentParent` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `joinDate` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `staffType` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `TeacherQualification` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `TeacherQualification` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `TeacherQualification` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `driverId` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `gpsDeviceId` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `helperName` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `helperPhone` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `make` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `permitExpiry` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `registrationNo` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `WorkSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `isOff` on the `WorkSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `WorkSchedule` table. All the data in the column will be lost.
  - Added the required column `insight` to the `AIObservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target` to the `Announcement` table without a default value. This is not possible if the table is not empty.
  - Made the column `licenseNo` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `date` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `channel` to the `FeeReminder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `FeeReminder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `FeeStructure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateTime` to the `FollowUp` table without a default value. This is not possible if the table is not empty.
  - Made the column `outcome` on table `FollowUp` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `netAmount` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Made the column `reason` on table `Leave` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `ageGroup` to the `Milestone` table without a default value. This is not possible if the table is not empty.
  - Made the column `milestoneId` on table `MilestoneTimeline` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `email` to the `Otp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentDate` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overallRating` to the `PerformanceReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `professionalDev` to the `PerformanceReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `punctuality` to the `PerformanceReview` table without a default value. This is not possible if the table is not empty.
  - Made the column `communication` on table `PerformanceReview` required. This step will fail if there are existing NULL values in that column.
  - Made the column `studentEngagement` on table `PerformanceReview` required. This step will fail if there are existing NULL values in that column.
  - Made the column `teachingQuality` on table `PerformanceReview` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `ageMax` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ageMin` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceId` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceId` to the `Refund` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `Refund` table without a default value. This is not possible if the table is not empty.
  - Made the column `reason` on table `Refund` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `endPoint` to the `Route` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startPoint` to the `Route` table without a default value. This is not possible if the table is not empty.
  - Added the required column `basicSalary` to the `SalaryRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `SalaryRecord` table without a default value. This is not possible if the table is not empty.
  - Made the column `value` on table `SchoolSetting` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gender` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `Teacher` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `Teacher` required. This step will fail if there are existing NULL values in that column.
  - Made the column `institution` on table `TeacherQualification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `year` on table `TeacherQualification` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driverName` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driverPhone` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleNo` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AIObservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "insight" TEXT NOT NULL,
    "dimension" TEXT,
    "severity" TEXT,
    "isActioned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIObservation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AIObservation" ("createdAt", "id", "studentId") SELECT "createdAt", "id", "studentId" FROM "AIObservation";
DROP TABLE "AIObservation";
ALTER TABLE "new_AIObservation" RENAME TO "AIObservation";
CREATE TABLE "new_Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "date" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Achievement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Achievement" ("createdAt", "date", "description", "icon", "id", "studentId", "title") SELECT "createdAt", "date", "description", "icon", "id", "studentId", "title" FROM "Achievement";
DROP TABLE "Achievement";
ALTER TABLE "new_Achievement" RENAME TO "Achievement";
CREATE TABLE "new_Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "materials" TEXT,
    "learningOutcomes" TEXT,
    "media" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "classId" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Activity_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Activity" ("classId", "createdAt", "date", "description", "endTime", "id", "isPublished", "learningOutcomes", "media", "startTime", "status", "title", "type", "updatedAt") SELECT "classId", "createdAt", "date", "description", "endTime", "id", "isPublished", "learningOutcomes", "media", "startTime", "status", "title", "type", "updatedAt" FROM "Activity";
DROP TABLE "Activity";
ALTER TABLE "new_Activity" RENAME TO "Activity";
CREATE TABLE "new_Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetIds" TEXT,
    "priority" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "scheduledAt" DATETIME,
    "channels" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Announcement" ("content", "createdAt", "createdBy", "id", "priority", "publishedAt", "scheduledAt", "title", "type", "updatedAt") SELECT "content", "createdAt", "createdBy", "id", "priority", "publishedAt", "scheduledAt", "title", "type", "updatedAt" FROM "Announcement";
DROP TABLE "Announcement";
ALTER TABLE "new_Announcement" RENAME TO "Announcement";
CREATE TABLE "new_AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("action", "createdAt", "entity", "entityId", "id", "ipAddress", "userId") SELECT "action", "createdAt", "entity", "entityId", "id", "ipAddress", "userId" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE TABLE "new_Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "inChargeName" TEXT,
    "inChargePhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Branch_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Branch" ("address", "createdAt", "id", "isActive", "name", "phone", "schoolId", "updatedAt") SELECT "address", "createdAt", "id", "isActive", "name", "phone", "schoolId", "updatedAt" FROM "Branch";
DROP TABLE "Branch";
ALTER TABLE "new_Branch" RENAME TO "Branch";
CREATE TABLE "new_Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "template" TEXT,
    "pdfUrl" TEXT,
    "issuedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Certificate" ("createdAt", "id", "studentId", "title") SELECT "createdAt", "id", "studentId", "title" FROM "Certificate";
DROP TABLE "Certificate";
ALTER TABLE "new_Certificate" RENAME TO "Certificate";
CREATE TABLE "new_ChatParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatParticipant_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatThread" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ChatParticipant" ("id", "role", "threadId", "userId") SELECT "id", "role", "threadId", "userId" FROM "ChatParticipant";
DROP TABLE "ChatParticipant";
ALTER TABLE "new_ChatParticipant" RENAME TO "ChatParticipant";
CREATE UNIQUE INDEX "ChatParticipant_threadId_userId_key" ON "ChatParticipant"("threadId", "userId");
CREATE TABLE "new_ChatThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ChatThread" ("createdAt", "id", "title", "type", "updatedAt") SELECT "createdAt", "id", "title", "type", "updatedAt" FROM "ChatThread";
DROP TABLE "ChatThread";
ALTER TABLE "new_ChatThread" RENAME TO "ChatThread";
CREATE TABLE "new_Class" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "section" TEXT,
    "branchId" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "teacherId" TEXT,
    "roomNo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Class_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Class_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Class" ("branchId", "capacity", "createdAt", "id", "name", "programId", "roomNo", "teacherId", "updatedAt") SELECT "branchId", "capacity", "createdAt", "id", "name", "programId", "roomNo", "teacherId", "updatedAt" FROM "Class";
DROP TABLE "Class";
ALTER TABLE "new_Class" RENAME TO "Class";
CREATE UNIQUE INDEX "Class_teacherId_key" ON "Class"("teacherId");
CREATE TABLE "new_DailyUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "breakfast" TEXT,
    "breakfastMenu" TEXT,
    "lunch" TEXT,
    "lunchMenu" TEXT,
    "snacks" TEXT,
    "snacksMenu" TEXT,
    "sleepStart" TEXT,
    "sleepEnd" TEXT,
    "sleepQuality" TEXT,
    "moodMorning" TEXT,
    "moodAfternoon" TEXT,
    "pottyCount" INTEGER NOT NULL DEFAULT 0,
    "pottyType" TEXT,
    "waterGlasses" INTEGER NOT NULL DEFAULT 0,
    "highlights" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "teacherId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyUpdate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DailyUpdate" ("breakfast", "breakfastMenu", "createdAt", "date", "highlights", "id", "lunch", "lunchMenu", "pottyCount", "pottyType", "publishedAt", "sleepEnd", "sleepQuality", "sleepStart", "snacks", "snacksMenu", "status", "studentId", "teacherId", "updatedAt", "waterGlasses") SELECT "breakfast", "breakfastMenu", "createdAt", "date", "highlights", "id", "lunch", "lunchMenu", "pottyCount", "pottyType", "publishedAt", "sleepEnd", "sleepQuality", "sleepStart", "snacks", "snacksMenu", "status", "studentId", "teacherId", "updatedAt", "waterGlasses" FROM "DailyUpdate";
DROP TABLE "DailyUpdate";
ALTER TABLE "new_DailyUpdate" RENAME TO "DailyUpdate";
CREATE UNIQUE INDEX "DailyUpdate_studentId_date_key" ON "DailyUpdate"("studentId", "date");
CREATE TABLE "new_Driver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "licenseNo" TEXT NOT NULL,
    "licenseExpiry" DATETIME,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Driver" ("address", "createdAt", "id", "isActive", "licenseExpiry", "licenseNo", "name", "phone") SELECT "address", "createdAt", "id", "isActive", "licenseExpiry", "licenseNo", "name", "phone" FROM "Driver";
DROP TABLE "Driver";
ALTER TABLE "new_Driver" RENAME TO "Driver";
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "venue" TEXT,
    "type" TEXT,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Event" ("createdAt", "description", "id", "title", "type", "updatedAt") SELECT "createdAt", "description", "id", "title", "type", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE TABLE "new_FeeReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "sentAt" DATETIME,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeeReminder_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FeeReminder" ("createdAt", "id", "invoiceId", "sentAt", "status") SELECT "createdAt", "id", "invoiceId", "sentAt", "status" FROM "FeeReminder";
DROP TABLE "FeeReminder";
ALTER TABLE "new_FeeReminder" RENAME TO "FeeReminder";
CREATE TABLE "new_FeeStructure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "frequency" TEXT NOT NULL,
    "classId" TEXT,
    "programId" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FeeStructure" ("amount", "classId", "createdAt", "description", "frequency", "id", "isActive", "name", "programId", "updatedAt") SELECT "amount", "classId", "createdAt", "description", "frequency", "id", "isActive", "name", "programId", "updatedAt" FROM "FeeStructure";
DROP TABLE "FeeStructure";
ALTER TABLE "new_FeeStructure" RENAME TO "FeeStructure";
CREATE TABLE "new_FollowUp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dateTime" DATETIME NOT NULL,
    "outcome" TEXT NOT NULL,
    "nextFollowUp" DATETIME,
    "notes" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FollowUp" ("createdAt", "id", "leadId", "notes", "outcome", "type") SELECT "createdAt", "id", "leadId", "notes", "outcome", "type" FROM "FollowUp";
DROP TABLE "FollowUp";
ALTER TABLE "new_FollowUp" RENAME TO "FollowUp";
CREATE TABLE "new_GrowthScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "creativity" INTEGER NOT NULL DEFAULT 0,
    "communication" INTEGER NOT NULL DEFAULT 0,
    "social" INTEGER NOT NULL DEFAULT 0,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "cognitive" INTEGER NOT NULL DEFAULT 0,
    "physical" INTEGER NOT NULL DEFAULT 0,
    "overall" REAL,
    "comments" TEXT,
    "assessedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GrowthScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GrowthScore" ("assessedBy", "cognitive", "comments", "communication", "confidence", "createdAt", "creativity", "id", "overall", "period", "physical", "studentId", "updatedAt") SELECT "assessedBy", "cognitive", "comments", "communication", "confidence", "createdAt", "creativity", "id", "overall", "period", "physical", "studentId", "updatedAt" FROM "GrowthScore";
DROP TABLE "GrowthScore";
ALTER TABLE "new_GrowthScore" RENAME TO "GrowthScore";
CREATE UNIQUE INDEX "GrowthScore_studentId_period_key" ON "GrowthScore"("studentId", "period");
CREATE TABLE "new_Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Holiday" ("createdAt", "date", "id", "name", "type") SELECT "createdAt", "date", "id", "name", "type" FROM "Holiday";
DROP TABLE "Holiday";
ALTER TABLE "new_Holiday" RENAME TO "Holiday";
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT,
    "amount" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "netAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" DATETIME NOT NULL,
    "paidDate" DATETIME,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("amount", "createdAt", "discount", "dueDate", "feeStructureId", "id", "invoiceNo", "status", "studentId", "updatedAt") SELECT "amount", "createdAt", "discount", "dueDate", "feeStructureId", "id", "invoiceNo", "status", "studentId", "updatedAt" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentName" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "parentEmail" TEXT,
    "childName" TEXT NOT NULL,
    "childAge" TEXT,
    "source" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "programInterest" TEXT,
    "estimatedValue" REAL,
    "assignedTo" TEXT,
    "notes" TEXT,
    "nextFollowUp" DATETIME,
    "convertedStudentId" TEXT,
    "lostReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Lead" ("assignedTo", "childName", "convertedStudentId", "createdAt", "id", "lostReason", "notes", "parentEmail", "parentName", "parentPhone", "priority", "programInterest", "source", "stage", "updatedAt") SELECT "assignedTo", "childName", "convertedStudentId", "createdAt", "id", "lostReason", "notes", "parentEmail", "parentName", "parentPhone", "priority", "programInterest", "source", "stage", "updatedAt" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE TABLE "new_Leave" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Leave_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Leave" ("approvedAt", "approvedBy", "createdAt", "endDate", "id", "leaveType", "reason", "startDate", "status", "teacherId") SELECT "approvedAt", "approvedBy", "createdAt", "endDate", "id", "leaveType", "reason", "startDate", "status", "teacherId" FROM "Leave";
DROP TABLE "Leave";
ALTER TABLE "new_Leave" RENAME TO "Leave";
CREATE TABLE "new_MedicalRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "allergies" TEXT,
    "conditions" TEXT,
    "medications" TEXT,
    "vaccinationStatus" TEXT,
    "doctorName" TEXT,
    "doctorPhone" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MedicalRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MedicalRecord" ("createdAt", "doctorName", "id", "studentId", "updatedAt") SELECT "createdAt", "doctorName", "id", "studentId", "updatedAt" FROM "MedicalRecord";
DROP TABLE "MedicalRecord";
ALTER TABLE "new_MedicalRecord" RENAME TO "MedicalRecord";
CREATE TABLE "new_Memory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "date" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Memory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Memory" ("createdAt", "date", "description", "id", "mediaType", "mediaUrl", "studentId", "title") SELECT "createdAt", "date", "description", "id", "mediaType", "mediaUrl", "studentId", "title" FROM "Memory";
DROP TABLE "Memory";
ALTER TABLE "new_Memory" RENAME TO "Memory";
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "mediaUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatThread" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("content", "createdAt", "id", "isRead", "senderId", "threadId") SELECT "content", "createdAt", "id", "isRead", "senderId", "threadId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE TABLE "new_Milestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT
);
INSERT INTO "new_Milestone" ("category", "description", "id", "name") SELECT "category", "description", "id", "name" FROM "Milestone";
DROP TABLE "Milestone";
ALTER TABLE "new_Milestone" RENAME TO "Milestone";
CREATE TABLE "new_MilestoneTimeline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "achievedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    CONSTRAINT "MilestoneTimeline_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MilestoneTimeline" ("achievedDate", "id", "milestoneId", "notes", "studentId") SELECT "achievedDate", "id", "milestoneId", "notes", "studentId" FROM "MilestoneTimeline";
DROP TABLE "MilestoneTimeline";
ALTER TABLE "new_MilestoneTimeline" RENAME TO "MilestoneTimeline";
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Notification" ("actionUrl", "createdAt", "id", "isRead", "message", "title", "type", "userId") SELECT "actionUrl", "createdAt", "id", "isRead", "message", "title", "type", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE TABLE "new_Observation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "parentAck" BOOLEAN NOT NULL DEFAULT false,
    "parentComment" TEXT,
    "media" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Observation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Observation" ("category", "content", "createdAt", "id", "isShared", "media", "parentComment", "priority", "studentId", "teacherId", "updatedAt") SELECT "category", "content", "createdAt", "id", "isShared", "media", "parentComment", "priority", "studentId", "teacherId", "updatedAt" FROM "Observation";
DROP TABLE "Observation";
ALTER TABLE "new_Observation" RENAME TO "Observation";
CREATE TABLE "new_Otp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Otp" ("code", "createdAt", "expiresAt", "id", "isUsed", "purpose") SELECT "code", "createdAt", "expiresAt", "id", "isUsed", "purpose" FROM "Otp";
DROP TABLE "Otp";
ALTER TABLE "new_Otp" RENAME TO "Otp";
CREATE TABLE "new_Parent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "occupation" TEXT,
    "address" TEXT,
    "relation" TEXT NOT NULL,
    "isEmergencyContact" BOOLEAN NOT NULL DEFAULT false,
    "kycDoc" TEXT,
    "kycStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Parent" ("address", "createdAt", "email", "firstName", "id", "kycStatus", "lastName", "occupation", "phone", "relation", "updatedAt") SELECT "address", "createdAt", "email", "firstName", "id", "kycStatus", "lastName", "occupation", "phone", "relation", "updatedAt" FROM "Parent";
DROP TABLE "Parent";
ALTER TABLE "new_Parent" RENAME TO "Parent";
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "method" TEXT NOT NULL,
    "transactionRef" TEXT,
    "chequeNo" TEXT,
    "bankName" TEXT,
    "paymentDate" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "bankName", "chequeNo", "createdAt", "id", "invoiceId", "notes", "transactionRef") SELECT "amount", "bankName", "chequeNo", "createdAt", "id", "invoiceId", "notes", "transactionRef" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE TABLE "new_PerformanceReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "teachingQuality" INTEGER NOT NULL,
    "studentEngagement" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "punctuality" INTEGER NOT NULL,
    "professionalDev" INTEGER NOT NULL,
    "overallRating" REAL NOT NULL,
    "comments" TEXT,
    "reviewerName" TEXT,
    "reviewDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PerformanceReview_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PerformanceReview" ("comments", "communication", "id", "period", "studentEngagement", "teacherId", "teachingQuality") SELECT "comments", "communication", "id", "period", "studentEngagement", "teacherId", "teachingQuality" FROM "PerformanceReview";
DROP TABLE "PerformanceReview";
ALTER TABLE "new_PerformanceReview" RENAME TO "PerformanceReview";
CREATE TABLE "new_PickupDrop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "time" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PickupDrop_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PickupDrop_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PickupDrop" ("createdAt", "id", "latitude", "location", "longitude", "studentId", "type", "vehicleId") SELECT "createdAt", "id", "latitude", "location", "longitude", "studentId", "type", "vehicleId" FROM "PickupDrop";
DROP TABLE "PickupDrop";
ALTER TABLE "new_PickupDrop" RENAME TO "PickupDrop";
CREATE TABLE "new_Program" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ageMin" INTEGER NOT NULL,
    "ageMax" INTEGER NOT NULL,
    "branchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Program_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Program" ("branchId", "createdAt", "description", "id", "name", "updatedAt") SELECT "branchId", "createdAt", "description", "id", "name", "updatedAt" FROM "Program";
DROP TABLE "Program";
ALTER TABLE "new_Program" RENAME TO "Program";
CREATE TABLE "new_Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Receipt_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Receipt" ("amount", "createdAt", "id", "receiptNo") SELECT "amount", "createdAt", "id", "receiptNo" FROM "Receipt";
DROP TABLE "Receipt";
ALTER TABLE "new_Receipt" RENAME TO "Receipt";
CREATE UNIQUE INDEX "Receipt_invoiceId_key" ON "Receipt"("invoiceId");
CREATE UNIQUE INDEX "Receipt_receiptNo_key" ON "Receipt"("receiptNo");
CREATE TABLE "new_Refund" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "bankAccount" TEXT,
    "bankIfsc" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Refund_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Refund" ("amount", "createdAt", "id", "notes", "processedAt", "reason", "status") SELECT "amount", "createdAt", "id", "notes", "processedAt", "reason", "status" FROM "Refund";
DROP TABLE "Refund";
ALTER TABLE "new_Refund" RENAME TO "Refund";
CREATE UNIQUE INDEX "Refund_invoiceId_key" ON "Refund"("invoiceId");
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "generatedBy" TEXT,
    "fileUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Report" ("createdAt", "fileUrl", "generatedBy", "id", "title", "type") SELECT "createdAt", "fileUrl", "generatedBy", "id", "title", "type" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE TABLE "new_Route" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startPoint" TEXT NOT NULL,
    "endPoint" TEXT NOT NULL,
    "stops" TEXT,
    "distance" REAL,
    "fee" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Route" ("createdAt", "distance", "id", "name", "stops", "updatedAt") SELECT "createdAt", "distance", "id", "name", "stops", "updatedAt" FROM "Route";
DROP TABLE "Route";
ALTER TABLE "new_Route" RENAME TO "Route";
CREATE TABLE "new_SalaryRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "basicSalary" REAL NOT NULL,
    "hra" REAL NOT NULL DEFAULT 0,
    "da" REAL NOT NULL DEFAULT 0,
    "pfDeduction" REAL NOT NULL DEFAULT 0,
    "taxDeduction" REAL NOT NULL DEFAULT 0,
    "otherDeductions" REAL NOT NULL DEFAULT 0,
    "deductionReason" TEXT,
    "bonus" REAL NOT NULL DEFAULT 0,
    "bonusReason" TEXT,
    "netPay" REAL NOT NULL,
    "paymentMethod" TEXT,
    "paymentDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalaryRecord_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SalaryRecord" ("createdAt", "da", "hra", "id", "month", "netPay", "otherDeductions", "paymentMethod", "pfDeduction", "status", "taxDeduction", "teacherId") SELECT "createdAt", "da", "hra", "id", "month", "netPay", "otherDeductions", "paymentMethod", "pfDeduction", "status", "taxDeduction", "teacherId" FROM "SalaryRecord";
DROP TABLE "SalaryRecord";
ALTER TABLE "new_SalaryRecord" RENAME TO "SalaryRecord";
CREATE TABLE "new_School" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "academicYear" TEXT,
    "board" TEXT,
    "schoolCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_School" ("address", "createdAt", "id", "logo", "name", "updatedAt") SELECT "address", "createdAt", "id", "logo", "name", "updatedAt" FROM "School";
DROP TABLE "School";
ALTER TABLE "new_School" RENAME TO "School";
CREATE TABLE "new_SchoolSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SchoolSetting_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SchoolSetting" ("createdAt", "id", "key", "schoolId", "updatedAt", "value") SELECT "createdAt", "id", "key", "schoolId", "updatedAt", "value" FROM "SchoolSetting";
DROP TABLE "SchoolSetting";
ALTER TABLE "new_SchoolSetting" RENAME TO "SchoolSetting";
CREATE UNIQUE INDEX "SchoolSetting_schoolId_key_key" ON "SchoolSetting"("schoolId", "key");
CREATE TABLE "new_Section" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    CONSTRAINT "Section_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Section" ("classId", "id", "name") SELECT "classId", "id", "name" FROM "Section";
DROP TABLE "Section";
ALTER TABLE "new_Section" RENAME TO "Section";
CREATE TABLE "new_Sibling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "siblingId" TEXT NOT NULL,
    "relation" TEXT,
    CONSTRAINT "Sibling_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sibling_siblingId_fkey" FOREIGN KEY ("siblingId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sibling" ("id", "relation", "siblingId", "studentId") SELECT "id", "relation", "siblingId", "studentId" FROM "Sibling";
DROP TABLE "Sibling";
ALTER TABLE "new_Sibling" RENAME TO "Sibling";
CREATE TABLE "new_StaffAttendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "method" TEXT,
    "markedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StaffAttendance" ("checkInTime", "checkOutTime", "createdAt", "date", "id", "markedBy", "method", "status", "teacherId") SELECT "checkInTime", "checkOutTime", "createdAt", "date", "id", "markedBy", "method", "status", "teacherId" FROM "StaffAttendance";
DROP TABLE "StaffAttendance";
ALTER TABLE "new_StaffAttendance" RENAME TO "StaffAttendance";
CREATE UNIQUE INDEX "StaffAttendance_teacherId_date_key" ON "StaffAttendance"("teacherId", "date");
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "aadhaarNumber" TEXT,
    "photo" TEXT,
    "admissionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "rollNumber" TEXT,
    "classId" TEXT,
    "branchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("bloodGroup", "branchId", "classId", "createdAt", "dob", "firstName", "gender", "id", "lastName", "photo", "status", "updatedAt") SELECT "bloodGroup", "branchId", "classId", "createdAt", "dob", "firstName", "gender", "id", "lastName", "photo", "status", "updatedAt" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE TABLE "new_StudentAttendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "method" TEXT,
    "markedBy" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StudentAttendance" ("checkInTime", "checkOutTime", "createdAt", "date", "id", "markedBy", "method", "status", "studentId") SELECT "checkInTime", "checkOutTime", "createdAt", "date", "id", "markedBy", "method", "status", "studentId" FROM "StudentAttendance";
DROP TABLE "StudentAttendance";
ALTER TABLE "new_StudentAttendance" RENAME TO "StudentAttendance";
CREATE UNIQUE INDEX "StudentAttendance_studentId_date_key" ON "StudentAttendance"("studentId", "date");
CREATE TABLE "new_StudentParent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "StudentParent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudentParent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StudentParent" ("id", "isPrimary", "parentId", "studentId") SELECT "id", "isPrimary", "parentId", "studentId" FROM "StudentParent";
DROP TABLE "StudentParent";
ALTER TABLE "new_StudentParent" RENAME TO "StudentParent";
CREATE UNIQUE INDEX "StudentParent_studentId_parentId_key" ON "StudentParent"("studentId", "parentId");
CREATE TABLE "new_Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" DATETIME,
    "gender" TEXT,
    "address" TEXT,
    "qualification" TEXT,
    "specialization" TEXT,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "photo" TEXT,
    "joiningDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "branchId" TEXT,
    "salary" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Teacher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Teacher" ("address", "branchId", "createdAt", "dob", "email", "experience", "firstName", "gender", "id", "lastName", "phone", "photo", "qualification", "specialization", "status", "updatedAt", "userId") SELECT "address", "branchId", "createdAt", "dob", "email", coalesce("experience", 0) AS "experience", "firstName", "gender", "id", "lastName", "phone", "photo", "qualification", "specialization", "status", "updatedAt", "userId" FROM "Teacher";
DROP TABLE "Teacher";
ALTER TABLE "new_Teacher" RENAME TO "Teacher";
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");
CREATE TABLE "new_TeacherQualification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "certificate" TEXT,
    CONSTRAINT "TeacherQualification_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TeacherQualification" ("certificate", "degree", "id", "institution", "teacherId", "year") SELECT "certificate", "degree", "id", "institution", "teacherId", "year" FROM "TeacherQualification";
DROP TABLE "TeacherQualification";
ALTER TABLE "new_TeacherQualification" RENAME TO "TeacherQualification";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'PARENT',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schoolId" TEXT,
    "branchId" TEXT,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("branchId", "createdAt", "email", "id", "isActive", "phone", "role", "updatedAt") SELECT "branchId", "createdAt", "email", "id", "isActive", "phone", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleNo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "routeId" TEXT,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT NOT NULL,
    "driverLicense" TEXT,
    "insuranceExpiry" DATETIME,
    "fitnessExpiry" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("capacity", "createdAt", "fitnessExpiry", "id", "insuranceExpiry", "isActive", "routeId", "type", "updatedAt") SELECT "capacity", "createdAt", "fitnessExpiry", "id", "insuranceExpiry", "isActive", "routeId", "type", "updatedAt" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE TABLE "new_WorkSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "subject" TEXT,
    "classId" TEXT,
    CONSTRAINT "WorkSchedule_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WorkSchedule" ("dayOfWeek", "endTime", "id", "startTime", "teacherId") SELECT "dayOfWeek", "endTime", "id", "startTime", "teacherId" FROM "WorkSchedule";
DROP TABLE "WorkSchedule";
ALTER TABLE "new_WorkSchedule" RENAME TO "WorkSchedule";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
