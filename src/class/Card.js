export default class Card {
	/**
	 * @param {number} id
	 * @param {string|null} color - couleurs disponibles :
	 *                              rouge  ("red")    ;
	 *                              jaune  ("yellow") ;
	 *                              bleu   ("blue")   ;
	 *                              orange ("orange")
	 * @param {true|false} active
	 * @param {""|"et"|"=>"} link - ""    = carte simple ;
	 *                              "¬"   = liaison "¬"  ;
	 *                              "et"  = liaison "et" ;
	 *                              "ou"  = liaison "ou" ;
	 *                              "=>"  = liaison "⇒" ;
	 *                              "<=>" = liaison "⟺"
	 * @param {Card|null} left
	 * @param {Card|null} right
	 */
	constructor(id, color, active, link, left, right, nouveau, suppr) {
		this.id = id;
		this.color = color;
		this.active = active;
		this.link = link;
		this.left = left;
		this.right = right;
		this.hover = false;
		this.nouveau = nouveau;
		this.suppr = suppr;
	}

	/**
	 * Traduit la couleur de la carte, de base en anglais, en français afin de l'afficher en format LaTeX.
	 * 
	 * @param {string} color - La couleur de la carte.
	 * 
	 * @returns {string} La traduction de la couleur.
	 */
	getColor = (color) => {
		switch (color) {
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
	 * @example "(rouge∧jaune) ⇒ bleu"
	 * 
	 * @returns {string} Un string plus lisible.
	 */
	toString()
	{
		let res = "";

		if (this.link === "non")
			return "non" + this.right.toString();

		// Couleur de la carte.
		if (this.color !== null)
			res += this.getColor(this.color);

		// Carte gauche.
		if (this.left !== null)
			res += "(" + this.left.toString();

		// Liaison.
		if (this.link === "et")
			res += "^";
		else if (this.link === "ou")
			res += "∨";
		else if (this.link === "=>")
			res += "=>";
		else if (this.link === "<=>")
			res += "<=>";
		else
			res += this.link;

		// Carte droite.
		if (this.right !== null)
			res += this.right.toString() + ")";

		return res;
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
	copy() {
		let l = null;
		let r = null;

		if (this.left !== null)
			l = this.left.copy();
		if (this.right !== null)
			r = this.right.copy();

		return new Card(this.id, this.color, this.active, this.link, l, r, this.nouveau, this.suppr);
	}

	/**
	 * Fonction récursive qui :
	 * - Change l'attribut "active"
	 * - Regarde si "left" & "right" sont null. S'ils ne le sont pas, on appelle la même fonction sur eux.
	 * 
	 * @param {true|false} state Booléen qui définit si une carte est sélectionnée ou pas.
	 */
	select(state)
	{
		this.active = state;

		if (this.left != null)
			this.left.select(state);
		if (this.right != null)
			this.right.select(state);
	}

	/**
	 * @param {true|false} state Booléen qui définit si une carte est sélectionnée ou pas.
	 */
	setOld(state)
	{
		this.nouveau = state;

		if (this.left != null)
			this.left.setOld(state);
		if (this.right != null)
			this.right.setOld(state);
	}

	/**
	 * @param {true|false} state Booléen qui définit si une carte est sélectionnée ou pas.
	 */
	setDel(state)
	{
		this.suppr = state;
		if (this.left != null)
			this.left.setDel(state);
		if (this.right != null)
			this.right.setDel(state);
	}

	/**
	 * Compare les attributs de 2 cartes.
	 * 
	 * @param {Card} card - L'autre carte à comparer.
	 * 
	 * @returns {true|false} True si identiques, sinon False.
	 */
	equals(card)
	{
		if (this.color !== null && card.color !== null)
			return this.color === card.color;
		else
		{
			let bool = true;
			if ((this.left === null && card.left !== null) ||
				(this.left !== null && card.left === null))
			{
				return false;
			}

			if ((this.right === null && card.right !== null) ||
				(this.right !== null && card.right === null))
			{
				return false;
			}

			if (this.link !== card.link)
				return false;

			if (this.left !== null && card.left !== null)
				bool = this.left.equals(card.left);

			if (this.right !== null && card.right !== null)
				bool = bool && this.right.equals(card.right);

			return bool;
		}
	}

	/**
	 * Renvoie la démonstration correspondante à l'action effectuée.
	 * 
	 * @returns {string} Le texte de la démonstration.
	 */
	toDemonstration()
	{
		if (this.color !== null)
			return "On a" + this.getColor(this.color);
		else if (this.link === "et")
			return "On a" + this.left.toString() + "∧" + this.right.toString();
		else if (this.link === "ou")
			return "On a" + this.left.toString() + "∨" + this.right.toString();
		else
			return "Puisque" + this.left.toString() + ", on a " + this.right.toString();
	}

	/**
	 * Renvoie la profondeur à laquelle est située la carte dans la carte complexe.
	 * 
	 * @returns {number} La profondeur de la carte
	 */
	getProfondeur()
	{
		let res = 1;
		if (this.color !== null)
			return res;

		const temp1 = this.left.getProfondeur();
		const temp2 = this.right.getProfondeur();
		const finalTemp = Math.max(temp1, temp2);
		res += finalTemp;

		return res;
	}

	/**
	 * Vérifie si la carte complexe a une de ses cartes qui possède le connecteur "=>".
	 * 
	 * @returns {true|false} true si la carte possède le connecteur "=>", sinon false
	 */
	haveImpliqueLinkRecur()
	{
		let res = false;
		if (this.color !== null)
			return false;

		if (this.link === "=>")
			res = true;

		return (res || this.left.haveImpliqueLinkRecur() || this.right.haveImpliqueLinkRecur());
	}

	/**
	 * Vérifie si la carte de l'objectif possède le connecteur "et".
	 * 
	 * @returns {true|false} true si la carte possède le connecteur "et", sinon false
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
	 * @returns {true|false} true si la carte possède le connecteur "<=>", sinon false
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

		return new Card(this.id, null, this.active, "<=>", this.left.left, this.left.right, this.nouveau, this.suppr);
	}

	/**
	 * Vérifie si la carte est une carte "non".
	 * 
	 * @returns {true|false} true si la carte est une carte "non", sinon false
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
	 * @returns {true|false} true si l'on peut l'utiliser, sinon false
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
			this.active,
			"non",
			new Card(0, "transparent", this.active, "", null, null),
			this.left,
			this.nouveau,
			this.suppr
		);
	}

	/**
	 * Vérifie si la carte possède le connecteur "ou".
	 * 
	 * @returns {true|false} true si la carte correspond à une carte avec un connecteur "ou", sinon false
	 */
	isOuCard() {
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
	 * @returns {Card} - La carte au format "ou" si c'est une carte "ou", sinon la cartede base
	 */
	ifOuReturnOuCard()
	{
		if (!this.isOuCard())
			return this;

		return new Card(this.id, null, this.active, "ou", this.left.left, this.right, this.nouveau, this.suppr);
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
	displayGoodCardRecur() {
		if (this.color !== null)
			return this;

		let temp = this.displayGoodCard();

		return new Card(temp.id, temp.color, temp.active, temp.link, temp.left.displayGoodCardRecur(), temp.right.displayGoodCardRecur(), this.nouveau, this.suppr);
	}
}
