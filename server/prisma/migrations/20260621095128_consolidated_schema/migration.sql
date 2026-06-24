-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `permissions` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    INDEX `Role_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `roleName` VARCHAR(191) NOT NULL DEFAULT 'user',
    `roleId` INTEGER NULL,
    `managerId` INTEGER NULL,
    `preferences` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_roleId_idx`(`roleId`),
    INDEX `User_managerId_idx`(`managerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `companyName` VARCHAR(191) NOT NULL DEFAULT 'MIS Report Extractor',
    `logo` VARCHAR(191) NULL,
    `favicon` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'UTC',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `dateFormat` VARCHAR(191) NOT NULL DEFAULT 'YYYY-MM-DD',
    `timeFormat` VARCHAR(191) NOT NULL DEFAULT '24h',
    `theme` VARCHAR(191) NOT NULL DEFAULT 'light',
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#3b82f6',
    `secondaryColor` VARCHAR(191) NOT NULL DEFAULT '#10b981',
    `reportSettings` JSON NULL,
    `emailSettings` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Campaign` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Campaign_name_key`(`name`),
    INDEX `Campaign_name_idx`(`name`),
    INDEX `Campaign_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Team` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `leaderId` INTEGER NULL,
    `supervisorId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Team_name_key`(`name`),
    INDEX `Team_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Agent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `campaignId` INTEGER NULL,
    `teamId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Agent_email_key`(`email`),
    INDEX `Agent_email_idx`(`email`),
    INDEX `Agent_campaignId_idx`(`campaignId`),
    INDEX `Agent_teamId_idx`(`teamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UploadedReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileName` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `uploadedById` INTEGER NOT NULL,
    `uploadDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `recordsCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'uploaded',
    `processingProgress` DOUBLE NOT NULL DEFAULT 0,
    `rawData` JSON NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UploadedReport_uploadedById_idx`(`uploadedById`),
    INDEX `UploadedReport_status_idx`(`status`),
    INDEX `UploadedReport_uploadDate_idx`(`uploadDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessedReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uploadedReportId` INTEGER NOT NULL,
    `processedById` INTEGER NOT NULL,
    `processedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalDialed` INTEGER NOT NULL DEFAULT 0,
    `connectedCalls` INTEGER NOT NULL DEFAULT 0,
    `notConnectedCalls` INTEGER NOT NULL DEFAULT 0,
    `qualifiedLeads` INTEGER NOT NULL DEFAULT 0,
    `inProcessLeads` INTEGER NOT NULL DEFAULT 0,
    `convertedLeads` INTEGER NOT NULL DEFAULT 0,
    `rejectedLeads` INTEGER NOT NULL DEFAULT 0,
    `duplicateNumbers` INTEGER NOT NULL DEFAULT 0,
    `uniqueNumbers` INTEGER NOT NULL DEFAULT 0,
    `agentWiseSummary` JSON NULL,
    `dateWiseSummary` JSON NULL,
    `statusWiseSummary` JSON NULL,
    `generatedFilePath` VARCHAR(191) NULL,
    `templateId` INTEGER NULL,
    `designId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProcessedReport_uploadedReportId_idx`(`uploadedReportId`),
    INDEX `ProcessedReport_processedById_idx`(`processedById`),
    INDEX `ProcessedReport_templateId_idx`(`templateId`),
    INDEX `ProcessedReport_processedDate_idx`(`processedDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportDesign` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `layout` JSON NULL,
    `sections` JSON NULL,
    `styling` JSON NULL,
    `filters` JSON NULL,
    `sorting` JSON NULL,
    `grouping` JSON NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `createdById` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ReportDesign_createdById_idx`(`createdById`),
    INDEX `ReportDesign_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `columns` JSON NULL,
    `formulas` JSON NULL,
    `aggregations` JSON NULL,
    `validations` JSON NULL,
    `createdById` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ReportTemplate_createdById_idx`(`createdById`),
    INDEX `ReportTemplate_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomFormula` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `formula` TEXT NOT NULL,
    `variables` JSON NULL,
    `returnType` VARCHAR(191) NOT NULL DEFAULT 'number',
    `category` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CustomFormula_createdById_idx`(`createdById`),
    INDEX `CustomFormula_isActive_idx`(`isActive`),
    INDEX `CustomFormula_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomKpi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `formulaId` INTEGER NULL,
    `calculation` TEXT NOT NULL,
    `targetValue` DOUBLE NULL,
    `comparison` VARCHAR(191) NOT NULL DEFAULT '>=',
    `displayFormat` VARCHAR(191) NOT NULL DEFAULT 'number',
    `aggregation` VARCHAR(191) NOT NULL DEFAULT 'sum',
    `filters` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CustomKpi_createdById_idx`(`createdById`),
    INDEX `CustomKpi_isActive_idx`(`isActive`),
    INDEX `CustomKpi_formulaId_idx`(`formulaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailySummary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportDate` DATE NOT NULL,
    `campaignId` INTEGER NULL,
    `teamId` INTEGER NULL,
    `agentId` INTEGER NULL,
    `totalDialed` INTEGER NOT NULL DEFAULT 0,
    `connectedCalls` INTEGER NOT NULL DEFAULT 0,
    `qualifiedLeads` INTEGER NOT NULL DEFAULT 0,
    `convertedLeads` INTEGER NOT NULL DEFAULT 0,
    `rejectedLeads` INTEGER NOT NULL DEFAULT 0,
    `connectionRate` DOUBLE NOT NULL DEFAULT 0,
    `conversionRate` DOUBLE NOT NULL DEFAULT 0,
    `qualificationRate` DOUBLE NOT NULL DEFAULT 0,
    `avgCallDuration` DOUBLE NOT NULL DEFAULT 0,
    `uniqueNumbers` INTEGER NOT NULL DEFAULT 0,
    `duplicateNumbers` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DailySummary_reportDate_idx`(`reportDate`),
    INDEX `DailySummary_campaignId_idx`(`campaignId`),
    INDEX `DailySummary_teamId_idx`(`teamId`),
    INDEX `DailySummary_agentId_idx`(`agentId`),
    UNIQUE INDEX `DailySummary_reportDate_campaignId_teamId_agentId_key`(`reportDate`, `campaignId`, `teamId`, `agentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WeeklySummary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `weekStart` DATE NOT NULL,
    `weekEnd` DATE NOT NULL,
    `year` INTEGER NOT NULL,
    `weekNumber` INTEGER NOT NULL,
    `campaignId` INTEGER NULL,
    `teamId` INTEGER NULL,
    `totalDialed` INTEGER NOT NULL DEFAULT 0,
    `connectedCalls` INTEGER NOT NULL DEFAULT 0,
    `qualifiedLeads` INTEGER NOT NULL DEFAULT 0,
    `convertedLeads` INTEGER NOT NULL DEFAULT 0,
    `connectionRate` DOUBLE NOT NULL DEFAULT 0,
    `conversionRate` DOUBLE NOT NULL DEFAULT 0,
    `avgDailyDialed` DOUBLE NOT NULL DEFAULT 0,
    `peakDayDialed` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WeeklySummary_weekStart_idx`(`weekStart`),
    INDEX `WeeklySummary_campaignId_idx`(`campaignId`),
    INDEX `WeeklySummary_teamId_idx`(`teamId`),
    UNIQUE INDEX `WeeklySummary_year_weekNumber_campaignId_teamId_key`(`year`, `weekNumber`, `campaignId`, `teamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonthlySummary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `monthStart` DATE NOT NULL,
    `monthEnd` DATE NOT NULL,
    `campaignId` INTEGER NULL,
    `teamId` INTEGER NULL,
    `totalDialed` INTEGER NOT NULL DEFAULT 0,
    `connectedCalls` INTEGER NOT NULL DEFAULT 0,
    `qualifiedLeads` INTEGER NOT NULL DEFAULT 0,
    `convertedLeads` INTEGER NOT NULL DEFAULT 0,
    `connectionRate` DOUBLE NOT NULL DEFAULT 0,
    `conversionRate` DOUBLE NOT NULL DEFAULT 0,
    `avgDailyDialed` DOUBLE NOT NULL DEFAULT 0,
    `peakDayDialed` INTEGER NOT NULL DEFAULT 0,
    `totalWorkingDays` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MonthlySummary_year_month_idx`(`year`, `month`),
    INDEX `MonthlySummary_campaignId_idx`(`campaignId`),
    INDEX `MonthlySummary_teamId_idx`(`teamId`),
    UNIQUE INDEX `MonthlySummary_year_month_campaignId_teamId_key`(`year`, `month`, `campaignId`, `teamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DashboardLayout` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,
    `layout` JSON NOT NULL,
    `widgets` JSON NOT NULL,
    `filters` JSON NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DashboardLayout_userId_idx`(`userId`),
    INDEX `DashboardLayout_isDefault_idx`(`isDefault`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ValidationReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uploadedReportId` INTEGER NOT NULL,
    `totalRecords` INTEGER NOT NULL DEFAULT 0,
    `validRecords` INTEGER NOT NULL DEFAULT 0,
    `invalidRecords` INTEGER NOT NULL DEFAULT 0,
    `errors` JSON NULL,
    `warnings` JSON NULL,
    `suggestions` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ValidationReport_uploadedReportId_idx`(`uploadedReportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ErrorReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uploadedReportId` INTEGER NOT NULL,
    `invalidRecords` JSON NULL,
    `missingFields` JSON NULL,
    `duplicateEntries` JSON NULL,
    `totalErrors` INTEGER NOT NULL DEFAULT 0,
    `canRetry` BOOLEAN NOT NULL DEFAULT true,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ErrorReport_uploadedReportId_idx`(`uploadedReportId`),
    INDEX `ErrorReport_canRetry_idx`(`canRetry`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessingLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uploadedReportId` INTEGER NOT NULL,
    `stage` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `progress` DOUBLE NOT NULL DEFAULT 0,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProcessingLog_uploadedReportId_idx`(`uploadedReportId`),
    INDEX `ProcessingLog_stage_idx`(`stage`),
    INDEX `ProcessingLog_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ColumnMapping` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `mappings` JSON NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ColumnMapping_createdById_idx`(`createdById`),
    INDEX `ColumnMapping_isDefault_idx`(`isDefault`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessingProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `columnMappingId` INTEGER NULL,
    `rules` JSON NULL,
    `filters` JSON NULL,
    `createdById` INTEGER NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProcessingProfile_createdById_idx`(`createdById`),
    INDEX `ProcessingProfile_isDefault_idx`(`isDefault`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessingRule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `condition` JSON NULL,
    `action` JSON NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProcessingRule_isActive_idx`(`isActive`),
    INDEX `ProcessingRule_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduledReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `schedule` VARCHAR(191) NOT NULL,
    `frequency` VARCHAR(191) NOT NULL DEFAULT 'daily',
    `templateId` INTEGER NULL,
    `recipients` JSON NULL,
    `subject` VARCHAR(191) NULL,
    `emailBody` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastRunAt` DATETIME(3) NULL,
    `nextRunAt` DATETIME(3) NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ScheduledReport_createdById_idx`(`createdById`),
    INDEX `ScheduledReport_isActive_idx`(`isActive`),
    INDEX `ScheduledReport_nextRunAt_idx`(`nextRunAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduledReportRun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scheduledReportId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `errorMessage` TEXT NULL,
    `reportFilePath` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ScheduledReportRun_scheduledReportId_idx`(`scheduledReportId`),
    INDEX `ScheduledReportRun_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampaignReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaignId` INTEGER NOT NULL,
    `reportDate` DATETIME(3) NOT NULL,
    `totalDialed` INTEGER NOT NULL DEFAULT 0,
    `connected` INTEGER NOT NULL DEFAULT 0,
    `qualified` INTEGER NOT NULL DEFAULT 0,
    `converted` INTEGER NOT NULL DEFAULT 0,
    `conversionRate` DOUBLE NOT NULL DEFAULT 0,
    `agentCount` INTEGER NOT NULL DEFAULT 0,
    `metrics` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CampaignReport_campaignId_idx`(`campaignId`),
    INDEX `CampaignReport_reportDate_idx`(`reportDate`),
    UNIQUE INDEX `CampaignReport_campaignId_reportDate_key`(`campaignId`, `reportDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentPerformance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentId` INTEGER NOT NULL,
    `reportDate` DATETIME(3) NOT NULL,
    `totalCalls` INTEGER NOT NULL DEFAULT 0,
    `connectedCalls` INTEGER NOT NULL DEFAULT 0,
    `qualifiedLeads` INTEGER NOT NULL DEFAULT 0,
    `convertedLeads` INTEGER NOT NULL DEFAULT 0,
    `conversionRate` DOUBLE NOT NULL DEFAULT 0,
    `productivityScore` DOUBLE NOT NULL DEFAULT 0,
    `rank` INTEGER NULL,
    `metrics` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AgentPerformance_agentId_idx`(`agentId`),
    INDEX `AgentPerformance_reportDate_idx`(`reportDate`),
    INDEX `AgentPerformance_rank_idx`(`rank`),
    UNIQUE INDEX `AgentPerformance_agentId_reportDate_key`(`agentId`, `reportDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportComparison` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `report1Id` INTEGER NOT NULL,
    `report2Id` INTEGER NOT NULL,
    `comparisonData` JSON NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ReportComparison_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `resourceId` INTEGER NULL,
    `details` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `statusCode` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_action_idx`(`action`),
    INDEX `AuditLog_resource_idx`(`resource`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemHealth` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cpuUsage` DOUBLE NOT NULL DEFAULT 0,
    `memoryUsage` DOUBLE NOT NULL DEFAULT 0,
    `diskUsage` DOUBLE NOT NULL DEFAULT 0,
    `activeConnections` INTEGER NOT NULL DEFAULT 0,
    `queueSize` INTEGER NOT NULL DEFAULT 0,
    `errorCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'healthy',
    `metadata` JSON NULL,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SystemHealth_status_idx`(`status`),
    INDEX `SystemHealth_checkedAt_idx`(`checkedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Backup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `filePath` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,
    `compression` BOOLEAN NOT NULL DEFAULT true,
    `includeFiles` BOOLEAN NOT NULL DEFAULT true,
    `createdById` INTEGER NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `errorMessage` TEXT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Backup_createdById_idx`(`createdById`),
    INDEX `Backup_status_idx`(`status`),
    INDEX `Backup_type_idx`(`type`),
    INDEX `Backup_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SearchHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `query` TEXT NOT NULL,
    `filters` JSON NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `resultCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SearchHistory_userId_idx`(`userId`),
    INDEX `SearchHistory_entityType_idx`(`entityType`),
    INDEX `SearchHistory_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportDownload` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `reportId` INTEGER NOT NULL,
    `reportType` VARCHAR(191) NOT NULL,
    `format` VARCHAR(191) NOT NULL DEFAULT 'xlsx',
    `downloadDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ipAddress` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,

    INDEX `ReportDownload_userId_idx`(`userId`),
    INDEX `ReportDownload_reportType_idx`(`reportType`),
    INDEX `ReportDownload_downloadDate_idx`(`downloadDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Agent` ADD CONSTRAINT `Agent_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `Campaign`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agent` ADD CONSTRAINT `Agent_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UploadedReport` ADD CONSTRAINT `UploadedReport_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessedReport` ADD CONSTRAINT `ProcessedReport_uploadedReportId_fkey` FOREIGN KEY (`uploadedReportId`) REFERENCES `UploadedReport`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessedReport` ADD CONSTRAINT `ProcessedReport_processedById_fkey` FOREIGN KEY (`processedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessedReport` ADD CONSTRAINT `ProcessedReport_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `ReportTemplate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessedReport` ADD CONSTRAINT `ProcessedReport_designId_fkey` FOREIGN KEY (`designId`) REFERENCES `ReportDesign`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportDesign` ADD CONSTRAINT `ReportDesign_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportTemplate` ADD CONSTRAINT `ReportTemplate_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomFormula` ADD CONSTRAINT `CustomFormula_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomKpi` ADD CONSTRAINT `CustomKpi_formulaId_fkey` FOREIGN KEY (`formulaId`) REFERENCES `CustomFormula`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomKpi` ADD CONSTRAINT `CustomKpi_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DashboardLayout` ADD CONSTRAINT `DashboardLayout_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ValidationReport` ADD CONSTRAINT `ValidationReport_uploadedReportId_fkey` FOREIGN KEY (`uploadedReportId`) REFERENCES `UploadedReport`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ErrorReport` ADD CONSTRAINT `ErrorReport_uploadedReportId_fkey` FOREIGN KEY (`uploadedReportId`) REFERENCES `UploadedReport`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessingLog` ADD CONSTRAINT `ProcessingLog_uploadedReportId_fkey` FOREIGN KEY (`uploadedReportId`) REFERENCES `UploadedReport`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ColumnMapping` ADD CONSTRAINT `ColumnMapping_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessingProfile` ADD CONSTRAINT `ProcessingProfile_columnMappingId_fkey` FOREIGN KEY (`columnMappingId`) REFERENCES `ColumnMapping`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessingProfile` ADD CONSTRAINT `ProcessingProfile_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduledReport` ADD CONSTRAINT `ScheduledReport_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `ReportTemplate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduledReport` ADD CONSTRAINT `ScheduledReport_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduledReportRun` ADD CONSTRAINT `ScheduledReportRun_scheduledReportId_fkey` FOREIGN KEY (`scheduledReportId`) REFERENCES `ScheduledReport`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CampaignReport` ADD CONSTRAINT `CampaignReport_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `Campaign`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentPerformance` ADD CONSTRAINT `AgentPerformance_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Backup` ADD CONSTRAINT `Backup_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SearchHistory` ADD CONSTRAINT `SearchHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportDownload` ADD CONSTRAINT `ReportDownload_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
