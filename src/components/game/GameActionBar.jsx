import { useClickOutsideMenu } from "../../hooks/useClickOutsideMenu";


/**
 * Barre d'actions du jeu (menus déroulants Bases, Objectifs, Tiers exclus, Transitivité).
 * Présentation uniquement : la logique des actions reste dans Game.jsx.
 */
const GameActionBar = ({
	mode,
	levelIndex,
	isActionUnlocked,
	addCardAnd,
	addCardFuse,
	fuseCardAnd,
	addObjectif,
	tiersExclus,
	transitivite,
}) => {
	const { isOpen: basesMenuOpen, setIsOpen: setBasesMenuOpen, menuRef: basesMenuRef } = useClickOutsideMenu();
	const { isOpen: objectifMenuOpen, setIsOpen: setObjectifMenuOpen, menuRef: objectifMenuRef } = useClickOutsideMenu();
	const { isOpen: tiersExclusMenuOpen, setIsOpen: setTiersExclusMenuOpen, menuRef: tiersExclusMenuRef } = useClickOutsideMenu();
	const { isOpen: transitiviteMenuOpen, setIsOpen: setTransitiviteMenuOpen, menuRef: transitiviteMenuRef } = useClickOutsideMenu();

	if (mode === "Create")
		return null;

	return (
		<>
			{/* Menu déroulant "Bases" : Séparation / Implique / Fusion */}
			{(isActionUnlocked("addAnd") || isActionUnlocked("addImplique") || isActionUnlocked("fuseAnd")) && (
				<div
					className="actionDropdown"
					ref={basesMenuRef}
					onMouseEnter={() => setBasesMenuOpen(true)}
					onMouseLeave={() => setBasesMenuOpen(false)}
				>
					<button
						type="button"
						id="bases"
						className="buttonAction"
						onClick={() => setBasesMenuOpen((open) => !open)}
					>
						<span className="buttonFormula">Bases</span>
					</button>
					{basesMenuOpen && (
						<div className="actionDropdownMenu">
							{isActionUnlocked("addAnd") && (
								<button
									type="button"
									className={mode === "Tutorial" && levelIndex === 0 ? "boutonSelection" : ""}
									onClick={() => { setBasesMenuOpen(false); addCardAnd(); }}
								>
									[P ∧ Q] → [P] [Q]
								</button>
							)}
							{isActionUnlocked("addImplique") && (
								<button
									type="button"
									className={mode === "Tutorial" && levelIndex === 1 ? "boutonSelection" : ""}
									onClick={() => { setBasesMenuOpen(false); addCardFuse(); }}
								>
									[P] [P ⇒ Q] → [Q]
								</button>
							)}
							{isActionUnlocked("fuseAnd") && (
								<button
									type="button"
									className={mode === "Tutorial" && levelIndex === 2 ? "boutonSelection" : ""}
									onClick={() => { setBasesMenuOpen(false); fuseCardAnd(); }}
								>
									[P] [Q] → [P ∧ Q]
								</button>
							)}
						</div>
					)}
				</div>
			)}

			{/* Menu déroulant "Objectifs" */}
			{(isActionUnlocked("addGoal_objectif") || isActionUnlocked("addGoal_lpu") || isActionUnlocked("addGoal_et")) && (
				<div
					className="actionDropdown"
					ref={objectifMenuRef}
					onMouseEnter={() => setObjectifMenuOpen(true)}
					onMouseLeave={() => setObjectifMenuOpen(false)}
				>
					<button
						type="button"
						id="addGoal"
						className="buttonAction"
						onClick={() => setObjectifMenuOpen((open) => !open)}
					>
						<span className="buttonFormula">Objectifs</span>
					</button>
					{objectifMenuOpen && (
						<div className="actionDropdownMenu">
							{isActionUnlocked("addGoal_objectif") && (
								<button
									type="button"
									className={mode === "Tutorial" && levelIndex === 3 ? "boutonSelection" : ""}
									onClick={() => { setObjectifMenuOpen(false); addObjectif("objectif"); }}
								>
									{"=> dans objectif"}
								</button>
							)}
							{isActionUnlocked("addGoal_lpu") && (
								<button type="button" onClick={() => { setObjectifMenuOpen(false); addObjectif("lpu"); }}>
									{"=> dans LPU"}
								</button>
							)}
							{isActionUnlocked("addGoal_et") && (
								<button type="button" onClick={() => { setObjectifMenuOpen(false); addObjectif("et"); }}>
									et
								</button>
							)}
						</div>
					)}
				</div>
			)}

			{/* Menu déroulant "Tiers exclus" */}
			{isActionUnlocked("tiersExclus") && (
				<div
					className="actionDropdown"
					ref={tiersExclusMenuRef}
					onMouseEnter={() => setTiersExclusMenuOpen(true)}
					onMouseLeave={() => setTiersExclusMenuOpen(false)}
				>
					<button
						type="button"
						id="tiersExclus"
						className="buttonAction"
						onClick={() => setTiersExclusMenuOpen((open) => !open)}
					>
						<span className="buttonFormula">Tiers Exclus</span>
					</button>
					{tiersExclusMenuOpen && (
						<div className="actionDropdownMenu">
							<button type="button" onClick={() => { setTiersExclusMenuOpen(false); tiersExclus(); }}>
								¬(¬P) → P
							</button>
						</div>
					)}
				</div>
			)}

			{/* Menu déroulant "Transitivité" */}
			{(isActionUnlocked("transitivite_arrow") || isActionUnlocked("transitivite_equiv") || isActionUnlocked("transitivite_equiv_sym")) && (
				<div
					className="actionDropdown"
					ref={transitiviteMenuRef}
					onMouseEnter={() => setTransitiviteMenuOpen(true)}
					onMouseLeave={() => setTransitiviteMenuOpen(false)}
				>
					<button
						type="button"
						id="transitivite"
						className="buttonAction"
						onClick={() => setTransitiviteMenuOpen((open) => !open)}
					>
						<span className="buttonFormula">Transitivité</span>
					</button>
					{transitiviteMenuOpen && (
						<div className="actionDropdownMenu">
							{isActionUnlocked("transitivite_arrow") && (
								<button type="button" onClick={() => { setTransitiviteMenuOpen(false); transitivite("arrow"); }}>
									⇒
								</button>
							)}
							{isActionUnlocked("transitivite_equiv") && (
								<button type="button" onClick={() => { setTransitiviteMenuOpen(false); transitivite("equiv"); }}>
									⇔
								</button>
							)}
							{isActionUnlocked("transitivite_equiv_sym") && (
								<button type="button" onClick={() => { setTransitiviteMenuOpen(false); transitivite("equiv_sym"); }}>
									⇔ sym
								</button>
							)}
						</div>
					)}
				</div>
			)}
		</>
	);
};

export default GameActionBar;