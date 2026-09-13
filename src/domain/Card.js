export default class Card
{
	/**
	 * @param {number} id
	 * @param {string|null} color - couleur de la carte, voir {@link getColor} pour la liste complète des valeurs possibles.
	 * @param {""|"et"|"ou"|"=>"|"<=>"|"non"} link - ""    = carte simple ;
	 *                                               "non" = liaison "¬"  ;
	 *                                               "et"  = liaison "et" ;
	 *                                               "ou"  = liaison "ou" ;
	 *                                               "=>"  = liaison "⇒" ;
	 *                                               "<=>" = liaison "⟺"
	 * @param {Card|null} left
	 * @param {Card|null} right
	 * @param {boolean} isNew - true si la carte doit être affichée avec l'animation d'apparition.
	 */
	constructor(id, color, link, left, right, isNew)
	{
		this.id = id;
		this.color = color;
		this.link = link;
		this.left = left;
		this.right = right;
		this.isNew = isNew;
	}

	/**
	 * Traduit la couleur de la carte (anglais) en français pour l'affichage textuel.
	 *
	 * @param {string} color - La couleur de la carte.
	 *
	 * @returns {string} La traduction de la couleur.
	 */
	getColor(color)
	{
		switch (color)
		{
			case "red": return "Rouge";
			case "yellow": return "Jaune";
			case "blue": return "Bleue";
			case "orange": return "Orange";
			case "green": return "Verte";
			case "purple": return "Mauve";
			case "black": return "Vrai";
			case "white": return "Faux";
			default: return "Non définie";
		}
	};

	/**
	 * Renvoie un objet {@link Card} sous la forme d'un string.
	 * Carte simple : "couleur"
	 * Carte double : "(couleur liaison couleur)"
	 * Carte triple : "(couleur liaison (couleur liaison (couleur))"
	 * Carte quadruple : ((couleur liaison couleur) liaison (couleur liaison couleur))
	 *
	 * @example "(Rouge^Jaune)=>Bleue"
	 *
	 * @returns {string} Un string plus lisible.
	 */
	toString()
	{
		let stringRepresentation = "";

		if (this.link === "non")
			return "non" + this.right.toString();

		// Couleur de la carte.
		if (this.color !== null)
			stringRepresentation += this.getColor(this.color);

		// Carte gauche.
		if (this.left !== null)
			stringRepresentation += "(" + this.left.toString();

		// Liaison.
		if (this.link === "et")
			stringRepresentation += "^";
		else if (this.link === "ou")
			stringRepresentation += "∨";
		else if (this.link === "=>")
			stringRepresentation += "=>";
		else if (this.link === "<=>")
			stringRepresentation += "<=>";
		else
			stringRepresentation += this.link;

		// Carte droite.
		if (this.right !== null)
			stringRepresentation += this.right.toString() + ")";

		return stringRepresentation;
	}

	/**
	 * Transforme un objet Card en objet JSON.
	 *
	 * @example
	 * { "color" : "couleur"}
	 * {
	 *   "left": { "color": "couleur" },
	 *   "link": "",
	 *   "right": { "color": "couleur" }
	 * }
	 * {
	 *   "left": { "color": "couleur" },
	 *   "link": "",
	 *   "right": {
	 *              "left": { "color": "couleur" },
	 *              "link": "et",
	 *              "right": { "color": "couleur" }
	 *            }
	 * }
	 * {
	 *   "left": {
	 *             "left": { "color": "couleur" },
	 *             "link": "=>",
	 *             "right": { "color": "couleur" }
	 *           },
	 *   "link": "=>",
	 *   "right": {
	 *              "left": { "color": "couleur" },
	 *              "link": "et",
	 *              "right": { "color": "couleur" }
	 *            }
	 * }
	 *
	 * @returns {JSON} à stocker dans un fichier .json
	 */
	toFile()
	{
		if (this.color !== null)
			return { color: this.color };
		else
		{
			return {
				left: this.left.toFile(),
				link: this.link,
				right: this.right.toFile(),
			};
		}
	}

	/**
	 * Renvoie une nouvelle instance d'une carte.
	 * Si la carte est composée de 2 autres cartes ces dernières sont également de nouvelles instances.
	 *
	 * @returns {Card} une nouvelle instance d'une même carte.
	 */
	copy()
	{
		const leftCopy = this.left != null ? this.left.copy() : null;
		const rightCopy = this.right != null ? this.right.copy() : null;

		return new Card(this.id, this.color, this.link, leftCopy, rightCopy, this.isNew);
	}

	/**
	 * Fonction récursive qui :
	 * - Change l'attribut "active"
	 * - Regarde si "left" & "right" sont null. S'ils ne le sont pas, on appelle la même fonction sur eux.
	 *
	 * @param {boolean} state Booléen qui définit si une carte est sélectionnée ou pas.
	 */
	select(state)
	{
		this.active = state;

		if (this.left !== null)
			this.left.select(state);
		if (this.right !== null)
			this.right.select(state);
	}

	/**
	 * @param {boolean} state Booléen qui définit si la carte doit être considérée comme "nouvelle"
	 *                           (affecte l'animation d'apparition sur le plateau).
	 */
	setNew(state)
	{
		this.isNew = state;

		if (this.left !== null)
			this.left.setNew(state);
		if (this.right !== null)
			this.right.setNew(state);
	}

	/**
	 * Compare les attributs de 2 cartes.
	 *
	 * @param {Card} card - L'autre carte à comparer.
	 *
	 * @returns {boolean} True si identiques, sinon False.
	 */
	equals(card)
	{
		if (card == null)
			return false;

		if (this.color !== null && card.color !== null)
			return this.color === card.color;

		if ((this.left === null) !== (card.left === null))
			return false;
		if ((this.right === null) !== (card.right === null))
			return false;
		if (this.link !== card.link)
			return false;

		let areEqual = true;
		if (this.left !== null && card.left !== null)
			areEqual = this.left.equals(card.left);
		if (this.right !== null && card.right !== null)
			areEqual = areEqual && this.right.equals(card.right);

		return areEqual;
	}

	/**
	 * Comme {@link equals}, mais pour deux cartes "<=>" (voir {@link isDoubleArrow}),
	 * considère qu'elles sont égales même si leurs deux implications internes sont
	 * écrites dans l'ordre inverse : "P<=>Q" (= et(P⇒Q, Q⇒P)) et "Q<=>P"
	 * (= et(Q⇒P, P⇒Q)) représentent le même fait et sont donc "la même carte".
	 * Retombe sur {@link equals} pour tout le reste.
	 *
	 * @param {Card} card - L'autre carte à comparer.
	 *
	 * @returns {boolean} True si identiques (au sens large ci-dessus), sinon False.
	 */
	equalsSymmetric(card)
	{
		if (card == null)
			return false;

		if (this.isDoubleArrow() && card.isDoubleArrow() &&
			this.left.equals(card.right) && this.right.equals(card.left))
			return true;

		return this.equals(card);
	}

	/**
	 * Renvoie la profondeur à laquelle est située la carte dans la carte complexe.
	 *
	 * @returns {number} La profondeur de la carte
	 */
	getProfondeur()
	{
		if (this.color !== null)
			return 1;

		const leftDepth = this.left.getProfondeur();
		const rightDepth = this.right.getProfondeur();
		return 1 + Math.max(leftDepth, rightDepth);
	}

	/**
	 * Vérifie si la carte complexe a une de ses cartes qui possède le connecteur "=>".
	 *
	 * @returns {boolean} true si la carte possède le connecteur "=>", sinon false
	 */
	haveImpliqueLinkRecur()
	{
		if (this.color !== null)
			return false;

		let containsImplicationLink = false;
		if (this.link === "=>")
			containsImplicationLink = true;

		return (containsImplicationLink || this.left.haveImpliqueLinkRecur() || this.right.haveImpliqueLinkRecur());
	}

	/**
	 * Vérifie si la carte de l'objectif possède le connecteur "et".
	 *
	 * @returns {boolean} true si la carte possède le connecteur "et", sinon false
	 */
	isCardEtObjectif()
	{
		if (this.color !== null)
			return false;

		if (this.link !== "et")
			return false;

		if (!this.haveImpliqueLinkRecur())
			return false;

		return true;
	}

	/**
	 * Vérifie si la carte possède le connecteur "<=>".
	 *
	 * @returns {boolean} true si la carte possède le connecteur "<=>", sinon false
	 */
	isDoubleArrow()
	{
		if (this.color !== null)
			return false;

		if (this.link !== "et")
			return false;

		if (this.left.link !== "=>" || this.right.link !== "=>")
			return false;

		if (!this.left.left.equals(this.right.right))
			return false;

		if (!this.left.right.equals(this.right.left))
			return false;

		return true;
	}

	/**
	 * Renvoie la bonne carte "<=>";
	 *
	 * @returns {Card} La bonne carte "<=>";
	 */
	ifDoubleArrowReturnGoodCard()
	{
		if (!this.isDoubleArrow())
			return this;

		return new Card(this.id, null, "<=>", this.left.left, this.left.right, this.isNew);
	}

	/**
	 * Vérifie si la carte est une carte "non".
	 *
	 * @returns {boolean} true si la carte est une carte "non", sinon false
	 */
	isNonCard()
	{
		if (this.color !== null)
			return false;

		if (this.right.color !== "white")
			return false;

		if (this.link !== "=>")
			return false;

		return true;
	}

	/**
	 * Vérifie si l'on peut utiliser le bouton "Tiers-Exclus" sur la carte.
	 *
	 * @returns {boolean} true si l'on peut l'utiliser, sinon false
	 */
	canUseTiersExclus()
	{
		if (!this.isNonCard())
			return false;

		if (!this.left.isNonCard())
			return false;

		return true;
	}

	/**
	 * Si la carte est censé être une carte "non", renvoie la carte au format "non" pour l'affichage.
	 *
	 * @returns {Card} - La carte au format "non" si c'est une carte "non", sinon la carte de base
	 */
	ifNonReturnNonCard()
	{
		if (!this.isNonCard()) 
			return this;

		return new Card(
			this.id,
			null,
			"non",
			new Card(0, "transparent", "", null, null),
			this.left,
			this.isNew
		);
	}

	/**
	 * Vérifie si la carte possède le connecteur "ou".
	 *
	 * @returns {boolean} true si la carte correspond à une carte avec un connecteur "ou", sinon false
	 */
	isOuCard()
	{
		if (this.color !== null)
			return false;

		if (!this.left.isNonCard())
			return false;

		if (this.link !== "=>")
			return false;

		return true;
	}

	/**
	 * Si la carte est censé être une carte "ou", renvoie la carte au format "ou" pour l'affichage.
	 *
	 * @returns {Card} - La carte au format "ou" si c'est une carte "ou", sinon la carte de base
	 */
	ifOuReturnOuCard()
	{
		if (!this.isOuCard())
			return this;

		return new Card(this.id, null, "ou", this.left.left, this.right, this.isNew);
	}

	/**
	 * Renvoie la carte sous un format d'affichage où sont affichés les connecteurs "<=>", "ou" et "non" plutôt que leurs
	 * équivalents logiques.
	 *
	 * @returns {Card} - La carte sous son autre format d'affichage.
	 */
	displayGoodCard()
	{
		let temp = this.ifDoubleArrowReturnGoodCard();
		temp = temp.ifOuReturnOuCard();
		temp = temp.ifNonReturnNonCard();

		return temp;
	}

	/**
	 * Renvoie la carte complexe sous un format d'affichage où sont affichés les connecteurs "<=>", "ou" et "non" plutôt que leurs
	 * équivalents logiques, à l'aide d'une récursion sur {@link displayGoodCard()}.
	 *
	 * @returns {Card} - La carte complexe sous son autre format d'affichage.
	 */
	displayGoodCardRecur()
	{
		if (this.color !== null)
			return this;

		let temp = this.displayGoodCard();

		return new Card(temp.id, temp.color, temp.link, temp.left.displayGoodCardRecur(), temp.right.displayGoodCardRecur(), this.isNew);
	}
}