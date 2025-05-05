import prisma from "../config/db.js";
import path from "path";

// Helper to get __dirname in ESM
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(
  __filename.startsWith("/") ? __filename.slice(1) : __filename
);

// Helper function to calculate work duration and payment
export const calculateWorkDurationAndPayment = (
  joiningDate,
  leaveDate,
  salary
) => {
  const start = new Date(joiningDate);
  const end = leaveDate ? new Date(leaveDate) : new Date();
  const diffMs = end - start;
  const daysWorked = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const monthlySalary = parseFloat(salary);

  const years = Math.floor(daysWorked / 365);
  const remainingDaysAfterYears = daysWorked % 365;
  const months = Math.floor(remainingDaysAfterYears / 30);
  const days = remainingDaysAfterYears % 30;

  const fullMonthsWorked = years * 12 + months;
  const dailyRate = monthlySalary / 30;
  const partialMonthPayment = days * dailyRate;
  const totalPayment = fullMonthsWorked * monthlySalary + partialMonthPayment;

  return {
    duration: { years, months, days },
    totalPayment: totalPayment.toFixed(2),
  };
};

// Create Member (Manager only)
export const createMember = async (req, res, next) => {
  try {
    console.log("Received createMember request:", {
      body: req.body,
      files: req.files,
      user: req.user,
    });

    if (req.user.role !== "MANAGER") {
      console.log("Unauthorized: User is not a manager");
      return res
        .status(403)
        .json({ error: "Only managers can create members" });
    }

    const {
      user_id,
      FirstName,
      LastName,
      phone,
      role,
      position,
      address,
      gender,
      dob,
      salary,
      joining_date,
      status,
      biography,
    } = req.body;

    console.log("Validating required fields");
    const requiredFields = [
      "user_id",
      "FirstName",
      "LastName",
      "role",
      "position",
      "salary",
      "joining_date",
      "status",
    ];
    const missingFields = requiredFields.filter(
      (key) => !req.body[key] || req.body[key] === ""
    );
    if (missingFields.length > 0) {
      console.log("Missing fields:", missingFields);
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    console.log("Checking user existence:", { user_id });
    const user = await prisma.users.findUnique({ where: { id: user_id } });
    if (!user) {
      console.log("User not found:", { user_id });
      return res.status(404).json({ error: "User not found" });
    }

    console.log("Checking for existing member:", { user_id });
    const existingMember = await prisma.members.findUnique({
      where: { user_id },
    });
    if (existingMember) {
      console.log("Member already exists:", { user_id });
      return res
        .status(400)
        .json({ error: "A member already exists for this user" });
    }

    console.log("Validating role and status");
    if (
      role.toUpperCase() !== user.role ||
      status.toUpperCase() !== user.status
    ) {
      console.log("Role/status mismatch:", {
        providedRole: role,
        userRole: user.role,
        providedStatus: status,
        userStatus: user.status,
      });
      return res.status(400).json({
        error: "Role and status must match the corresponding user's data",
      });
    }
    if (FirstName !== user.FirstName || LastName !== user.LastName) {
      console.log("Name mismatch:", {
        providedFirstName: FirstName,
        userFirstName: user.FirstName,
        providedLastName: LastName,
        userLastName: user.LastName,
      });
      return res.status(400).json({
        error:
          "FirstName and LastName must match the corresponding user's data",
      });
    }

    console.log("Processing file uploads");
    const photoFile = req.files?.photo?.[0];
    const certificateFile = req.files?.certificate?.[0];

    console.log("Uploaded files:", {
      photo: photoFile ? photoFile.path : "No photo uploaded",
      certificate: certificateFile
        ? certificateFile.path
        : "No certificate uploaded",
    });

    if (
      photoFile &&
      !["image/jpeg", "image/png"].includes(photoFile.mimetype)
    ) {
      console.log("Invalid photo file type:", photoFile.mimetype);
      return res
        .status(400)
        .json({ error: "Photo must be a JPEG or PNG file" });
    }
    if (
      certificateFile &&
      !["image/jpeg", "image/png", "application/pdf"].includes(
        certificateFile.mimetype
      )
    ) {
      console.log("Invalid certificate file type:", certificateFile.mimetype);
      return res
        .status(400)
        .json({ error: "Certificate must be a JPEG, PNG, or PDF file" });
    }

    console.log("Preparing file paths");
    const photoPath = photoFile
      ? path.relative(__dirname, photoFile.path).replace(/\\/g, "/")
      : null;
    const certificatePath = certificateFile
      ? path.relative(__dirname, photoFile.path).replace(/\\/g, "/")
      : null;

    console.log("Creating member data");
    const memberData = {
      user_id,
      FirstName,
      LastName,
      phone: phone || null,
      position,
      address: address || null,
      certificate: certificatePath,
      Photo: photoPath,
      gender: gender ? gender.toUpperCase() : null,
      dob: dob ? new Date(dob) : null,
      salary: parseFloat(salary),
      joining_date: new Date(joining_date),
      status: status.toUpperCase(),
      role: role.toUpperCase(),
      biography: biography || null,
    };

    console.log("Saving member to database:", memberData);
    const member = await prisma.members.create({ data: memberData });
    console.log(`Created Member by user ${req.user.id}:`, {
      id: member.id,
      Photo: member.Photo,
      certificate: member.certificate,
    });
    res.status(201).json({ message: "Member created successfully", member });
  } catch (error) {
    console.error("Error in createMember:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      error: "Failed to create member",
      details: error.message || "Unknown server error",
    });
  }
};

// Update Member (Manager only)
export const updateMember = async (req, res, next) => {
  try {
    if (req.user.role !== "MANAGER") {
      return res
        .status(403)
        .json({ error: "Only managers can update members" });
    }

    const { id } = req.params;
    const {
      FirstName,
      LastName,
      phone,
      role,
      position,
      address,
      gender,
      dob,
      salary,
      joining_date,
      status,
      biography,
    } = req.body;

    const member = await prisma.members.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    if (role && role.toUpperCase() !== member.user.role) {
      return res
        .status(400)
        .json({ error: "Role must match the corresponding user's role" });
    }
    if (status && status.toUpperCase() !== member.user.status) {
      return res
        .status(400)
        .json({ error: "Status must match the corresponding user's status" });
    }

    // Handle file uploads
    const photoFile = req.files?.photo?.[0];
    const certificateFile = req.files?.certificate?.[0];

    console.log("Uploaded files for update:", {
      photo: photoFile ? photoFile.path : "No photo uploaded",
      certificate: certificateFile
        ? certificateFile.path
        : "No certificate uploaded",
    });

    if (
      photoFile &&
      !["image/jpeg", "image/png"].includes(photoFile.mimetype)
    ) {
      return res
        .status(400)
        .json({ error: "Photo must be a JPEG or PNG file" });
    }
    if (
      certificateFile &&
      !["image/jpeg", "image/png", "application/pdf"].includes(
        certificateFile.mimetype
      )
    ) {
      return res
        .status(400)
        .json({ error: "Certificate must be a JPEG, PNG, or PDF file" });
    }

    // Store relative file paths with forward slashes
    const photoPath = photoFile
      ? path.relative(__dirname, photoFile.path).replace(/\\/g, "/")
      : undefined;
    const certificatePath = certificateFile
      ? path.relative(__dirname, certificateFile.path).replace(/\\/g, "/")
      : undefined;

    const userUpdates = {};
    if (FirstName && FirstName !== member.FirstName)
      userUpdates.FirstName = FirstName;
    if (LastName && LastName !== member.LastName)
      userUpdates.LastName = LastName;

    if (Object.keys(userUpdates).length > 0) {
      await prisma.users.update({
        where: { id: member.user_id },
        data: userUpdates,
      });
    }

    const memberUpdateData = {
      FirstName: FirstName ?? member.FirstName,
      LastName: LastName ?? member.LastName,
      phone: phone ?? member.phone,
      position: position ?? member.position,
      address: address ?? member.address,
      certificate:
        certificatePath !== undefined ? certificatePath : member.certificate,
      Photo: photoPath !== undefined ? photoPath : member.Photo,
      gender: gender ? gender.toUpperCase() : member.gender,
      dob: dob ? new Date(dob) : member.dob,
      salary: salary !== undefined ? parseFloat(salary) : member.salary,
      joining_date: joining_date ? new Date(joining_date) : member.joining_date,
      status: status ? status.toUpperCase() : member.status,
      role: role ? role.toUpperCase() : member.role,
      biography: biography ?? member.biography,
    };

    const updatedMember = await prisma.members.update({
      where: { id },
      data: memberUpdateData,
    });

    console.log(`Updated Member ${id} by user ${req.user.id}:`, {
      Photo: updatedMember.Photo,
      certificate: updatedMember.certificate,
    });
    res.status(200).json({
      message: "Member updated successfully",
      member: updatedMember,
    });
  } catch (error) {
    console.error(`Error in updateMember for ID ${req.params.id}:`, {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      error: "Failed to update member",
      details: error.message || "Unknown server error",
    });
  }
};

// Update Self Member (Employee only)
export const updateSelfMember = async (req, res, next) => {
  try {
    if (req.user.role !== "EMPLOYEE") {
      return res
        .status(403)
        .json({ error: "Only employees can update their own member profile" });
    }

    const member = await prisma.members.findUnique({
      where: { user_id: req.user.id },
      include: { user: true },
    });
    if (!member) {
      return res.status(404).json({ error: "Member profile not found" });
    }

    const { FirstName, LastName, phone, address, gender, dob, biography } =
      req.body;

    // Handle file uploads
    const photoFile = req.files?.photo?.[0];
    const certificateFile = req.files?.certificate?.[0];

    console.log("Uploaded files for self update:", {
      photo: photoFile ? photoFile.path : "No photo uploaded",
      certificate: certificateFile
        ? certificateFile.path
        : "No certificate uploaded",
    });

    if (
      photoFile &&
      !["image/jpeg", "image/png"].includes(photoFile.mimetype)
    ) {
      return res
        .status(400)
        .json({ error: "Photo must be a JPEG or PNG file" });
    }
    if (
      certificateFile &&
      !["image/jpeg", "image/png", "application/pdf"].includes(
        certificateFile.mimetype
      )
    ) {
      return res
        .status(400)
        .json({ error: "Certificate must be a JPEG, PNG, or PDF file" });
    }

    // Store relative file paths with forward slashes
    const photoPath = photoFile
      ? path.relative(__dirname, photoFile.path).replace(/\\/g, "/")
      : undefined;
    const certificatePath = certificateFile
      ? path.relative(__dirname, certificateFile.path).replace(/\\/g, "/")
      : undefined;

    const userUpdates = {};
    if (FirstName && FirstName !== member.FirstName)
      userUpdates.FirstName = FirstName;
    if (LastName && LastName !== member.LastName)
      userUpdates.LastName = LastName;

    if (Object.keys(userUpdates).length > 0) {
      await prisma.users.update({
        where: { id: req.user.id },
        data: userUpdates,
      });
    }

    const memberUpdateData = {
      FirstName: FirstName ?? member.FirstName,
      LastName: LastName ?? member.LastName,
      phone: phone ?? member.phone,
      address: address ?? member.address,
      certificate:
        certificatePath !== undefined ? certificatePath : member.certificate,
      Photo: photoPath !== undefined ? photoPath : member.Photo,
      gender: gender ? gender.toUpperCase() : member.gender,
      dob: dob ? new Date(dob) : member.dob,
      biography: biography ?? member.biography,
    };

    const updatedMember = await prisma.members.update({
      where: { id: member.id },
      data: memberUpdateData,
    });

    console.log(`Updated Self Member by user ${req.user.id}:`, {
      Photo: updatedMember.Photo,
      certificate: updatedMember.certificate,
    });
    res.status(200).json({
      message: "Member profile updated successfully",
      member: updatedMember,
    });
  } catch (error) {
    console.error(`Error in updateSelfMember:`, {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      error: "Failed to update self member",
      details: error.message || "Unknown server error",
    });
  }
};

// Get All Members (Active only)
export const getAllMembers = async (req, res, next) => {
  try {
    if (req.user.role === "MANAGER") {
      const members = await prisma.members.findMany({
        where: {
          user_id: { not: req.user.id },
          role: "EMPLOYEE",
          status: "ACTIVE",
        },
        include: { user: true },
      });
      console.log(`Fetched ${members.length} members by user ${req.user.id}`);
      res.status(200).json({ memberCount: members.length, members });
    } else if (req.user.role === "EMPLOYEE") {
      const member = await prisma.members.findUnique({
        where: { user_id: req.user.id },
        include: { user: true },
      });
      if (!member) {
        return res
          .status(404)
          .json({ error: "No member profile found for this employee" });
      }
      console.log(`Fetched self member by user ${req.user.id}`);
      res.status(200).json({ memberCount: 1, members: [member] });
    } else {
      return res.status(403).json({ error: "Unauthorized role" });
    }
  } catch (error) {
    console.error(`Error in getAllMembers:`, {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      error: "Failed to fetch members",
      details: error.message || "Unknown server error",
    });
  }
};

// Get All Members Including Inactive (for filtering)
export const getAllMembersIncludingInactive = async (req, res, next) => {
  try {
    if (req.user.role !== "MANAGER") {
      return res
        .status(403)
        .json({ error: "Only managers can access this endpoint" });
    }
    const members = await prisma.members.findMany({
      where: {
        user_id: { not: req.user.id },
        role: "EMPLOYEE",
      },
      include: {
        user: {
          select: {
            id: true,
            FirstName: true,
            LastName: true,
            username: true,
            role: true,
            status: true,
          },
        },
      },
    });
    console.log(
      `Fetched ${members.length} members (including inactive) by user ${req.user.id}`
    );
    res.status(200).json(members);
  } catch (error) {
    console.error(`Error in getAllMembersIncludingInactive:`, {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      error: "Failed to fetch members",
      details: error.message || "Unknown server error",
    });
  }
};

// Get Member by ID
export const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const member = await prisma.members.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    if (req.user.role === "EMPLOYEE" && member.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only view your own member profile" });
    }

    console.log(`Fetched member ${id} by user ${req.user.id}`, {
      Photo: member.Photo,
      certificate: member.certificate,
    });
    res.status(200).json(member);
  } catch (error) {
    console.error(`Error in getMemberById for ID ${req.params.id}:`, {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      error: "Failed to fetch member",
      details: error.message || "Unknown server error",
    });
  }
};

// Delete Member (Manager only)
export const deleteMember = async (req, res, next) => {
  try {
    if (req.user.role !== "MANAGER") {
      return res
        .status(403)
        .json({ error: "Only managers can delete members" });
    }

    const { id } = req.params;
    const { leaveDate } = req.body;

    const member = await prisma.members.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    if (member.user_id === req.user.id) {
      return res
        .status(403)
        .json({ error: "Manager cannot delete their own member profile" });
    }

    const { duration, totalPayment } = calculateWorkDurationAndPayment(
      member.joining_date,
      leaveDate,
      member.salary
    );

    await prisma.members.delete({
      where: { id },
    });

    console.log(`Deleted Member ${id} by user ${req.user.id}`);
    res.status(200).json({
      message: "Member deleted successfully",
      workDuration: duration,
      finalPayment: totalPayment,
    });
  } catch (error) {
    console.error(`Error in deleteMember for ID ${req.params.id}:`, {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      error: "Failed to delete member",
      details: error.message || "Unknown server error",
    });
  }
};
