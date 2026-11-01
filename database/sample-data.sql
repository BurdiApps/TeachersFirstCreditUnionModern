-- Optional fictional dashboard data. First create this member through the React
-- registration form using alex.morgan@teachersfirst.local.
DECLARE @MemberEmail nvarchar(256) = N'alex.morgan@teachersfirst.local';
DECLARE @MemberId uniqueidentifier;

SELECT @MemberId = Id
FROM dbo.AspNetUsers
WHERE NormalizedEmail = UPPER(@MemberEmail);

IF @MemberId IS NULL
    THROW 51000, 'Register alex.morgan@teachersfirst.local in the app before adding sample data.', 1;

IF EXISTS (SELECT 1 FROM dbo.Accounts WHERE MemberId = @MemberId)
BEGIN
    PRINT 'Sample accounts are already linked to this member.';
    RETURN;
END;

DECLARE @CheckingId uniqueidentifier = NEWID();
DECLARE @SavingsId uniqueidentifier = NEWID();
DECLARE @SummerId uniqueidentifier = NEWID();

INSERT INTO dbo.Accounts
    (Id, MemberId, Name, MaskedNumber, AccountType, Balance, AvailableBalance, AnnualPercentageYield, CreatedAtUtc)
VALUES
    (@CheckingId, @MemberId, 'Everyday Checking', '•• 1042', 'Checking', 4286.52, 4286.52, NULL, SYSUTCDATETIME()),
    (@SavingsId, @MemberId, 'Member Savings', '•• 2008', 'Savings', 12450.00, 12450.00, 0.040, SYSUTCDATETIME()),
    (@SummerId, @MemberId, 'Summer Savings', '•• 3010', 'Savings', 3200.00, 3200.00, 0.040, SYSUTCDATETIME());

INSERT INTO dbo.Transactions (Id, AccountId, Description, Category, Amount, PostedAtUtc)
VALUES
    (NEWID(), @CheckingId, 'Maple Market', 'Groceries', -64.28, '2026-10-22T16:00:00Z'),
    (NEWID(), @CheckingId, 'City School District', 'Payroll', 2480.00, '2026-10-21T16:00:00Z'),
    (NEWID(), @CheckingId, 'Transfer to Summer Savings', 'Transfer', -200.00, '2026-10-20T16:00:00Z'),
    (NEWID(), @CheckingId, 'The Reading Room', 'Shopping', -38.50, '2026-10-19T16:00:00Z');
