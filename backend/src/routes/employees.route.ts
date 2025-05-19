/**
 * Route GET /api/employees/team/:teamId
 * Récupère tous les employés d'une équipe spécifique
 */
router.get("/team/:teamId", async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    console.log(
      `[GET /employees/team/:teamId] Recherche des employés pour l'équipe: ${teamId}`
    );

    // Vérifier que l'ID d'équipe est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      console.log(
        `[GET /employees/team/:teamId] ID d'équipe invalide: ${teamId}`
      );
      return res.status(400).json({
        success: false,
        message: "ID d'équipe invalide",
      });
    }

    // Récupérer l'équipe pour vérifier son existence
    const team = await TeamModel.findById(teamId);
    if (!team) {
      console.log(
        `[GET /employees/team/:teamId] Équipe non trouvée: ${teamId}`
      );
      return res.status(404).json({
        success: false,
        message: "Équipe introuvable",
      });
    }

    console.log(`[GET /employees/team/:teamId] Équipe trouvée: ${team.name}`);

    // Utiliser la méthode statique pour récupérer les employés de l'équipe
    const employees = await EmployeeModel.find({ teamId })
      .populate("userId", "email")
      .lean();

    console.log(
      `[GET /employees/team/:teamId] ${employees.length} employés trouvés`
    );

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("[GET /employees/team/:teamId] Erreur:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des employés",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
