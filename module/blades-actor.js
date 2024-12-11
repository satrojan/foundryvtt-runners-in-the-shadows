import { bladesRoll } from "./blades-roll.js";
import { BladesHelpers } from "./blades-helpers.js";

/**
 * Extend the basic Actor
 * @extends {Actor}
 */
export class BladesActor extends Actor {

  /** @override */
  static async create(data, options={}) {

    data.prototypeToken = data.prototypeToken || {};

    // For Crew and Character set the Token to sync with charsheet.
    switch (data.type) {
      case 'character':
      case 'crew':
      case '\uD83D\uDD5B clock':
        data.prototypeToken.actorLink = true;
        break;
    }

    return super.create(data, options);
  }

  /** @override */
  getRollData() {
    const rollData = super.getRollData();

    rollData.dice_amount = this.getAttributeDiceToThrow();

    return rollData;
  }

  /* -------------------------------------------- */
  /**
   * Calculate Attribute Dice to throw.
   */
  getAttributeDiceToThrow() {

    // Calculate Dice to throw.
    let dice_amount = {};
    dice_amount['BITD.Vice'] = 4;

    for (var attribute_name in this.system.attributes) {
      dice_amount[attribute_name] = 0;
      for (var skill_name in this.system.attributes[attribute_name].skills) {
        dice_amount[skill_name] = parseInt(this.system.attributes[attribute_name].skills[skill_name]['value'][0])

        // We add a +1d for every skill higher than 0.
        if (dice_amount[skill_name] > 0) {
          dice_amount[attribute_name]++;
        }
      }
      // Vice dice roll uses lowest attribute dice amount
      dice_amount['BITD.Vice'] = Math.min(dice_amount['intuition'],dice_amount['body'],dice_amount['willpower']);
    }

    return dice_amount;
  }

  /* -------------------------------------------- */

  rollAttributePopup(attribute_name) {

    // const roll = new Roll("1d20 + @abilities.wis.mod", actor.getRollData());
    let attribute_label = BladesHelpers.getRollLabel(attribute_name);

    let content = `
        <h2>${game.i18n.localize('BITD.Roll')} ${game.i18n.localize(attribute_label)}</h2>
        <form>
          <div class="form-group">
            <label>${game.i18n.localize('BITD.Modifier')}:</label>
            <select id="mod" name="mod">
              ${this.createListOfDiceMods(-3,+3,0)}
            </select>
          </div>`;
    if (BladesHelpers.isAttributeAction(attribute_name)) {
      content += `
        <fieldset class="form-group" style="display:block;justify-content:space-between;">
          <legend>Roll Types</legend>
          <div class="radio-group" style="display:flex;flex-direction:row;justify-content:space-between;">
            <label style="width: 100px; display: inline-block;"><input type="radio" id="actionRoll" name="rollSelection" checked=true> ${game.i18n.localize("BITD.ActionRoll")}</label>
            <span style="width:150px">
              <label>${game.i18n.localize('BITD.Position')}:</label>
              <select id="pos" name="pos">
                <option value="controlled">${game.i18n.localize('BITD.PositionControlled')}</option>
                <option value="risky" selected>${game.i18n.localize('BITD.PositionRisky')}</option>
                <option value="desperate">${game.i18n.localize('BITD.PositionDesperate')}</option>
              </select>
            </span>
            <span style="width:150px">
              <label>${game.i18n.localize('BITD.Effect')}:</label>
              <select id="fx" name="fx">
                <option value="limited">${game.i18n.localize('BITD.EffectLimited')}</option>
                <option value="standard" selected>${game.i18n.localize('BITD.EffectStandard')}</option>
                <option value="great">${game.i18n.localize('BITD.EffectGreat')}</option>
              </select>
            </span>
          </div>
          <div class="radio-group" >
            <label>
              <input type="radio" id="fortune" name="rollSelection"> ${game.i18n.localize("BITD.Fortune")}
            </label>
          </div>
          <div class="radio-group">
            <label>
              <input type="radio" id="gatherInfo" name="rollSelection"> ${game.i18n.localize("BITD.GatherInformation")}
            </label>
          </div>
          <div class="radio-group">
            <label>
              <input type="radio" id="indulgeVice" name="rollSelection"> ${game.i18n.localize("BITD.IndulgeVice")}
            </label>
          </div>
          <div class="radio-group" style="display:flex;flex-direction:row;justify-content:space-between;">
            <label><input type="radio" id="engagement" name="rollSelection"> ${game.i18n.localize("BITD.Engagement")}</label>
            <span style="width:200px">
              <label>${game.i18n.localize("BITD.RollNumberOfDice")}:</label>
              <select id="qty" name="qty">
                ${Array(11).fill().map((item, i) => `<option value="${i}">${i}d</option>`).join('')}
              </select>
            </span>
          </div>
          <div class="radio-group" style="display:flex;flex-direction:row;justify-content:space-between;">
            <label><input type="radio" id="acqurieAsset" name="rollSelection"> ${game.i18n.localize("BITD.AcquireAsset")}</label>
            <span style="width:200px">
              <label>${game.i18n.localize('BITD.CrewTier')}:</label>
              <select id="tier" name="tier">
                ${Array(5).fill().map((item, i) => `<option value="${i}">${i}</option>`).join('')}
              </select>
            </span>
          </div>
        </fieldset>
            `;
    } else {
        content += `
            <input  id="pos" name="pos" type="hidden" value="">
            <input id="fx" name="fx" type="hidden" value="">`;
    }
    content += `
        <div className="form-group">
          <label>${game.i18n.localize('BITD.Notes')}:</label>
          <input id="note" name="note" type="text" value="">
        </div><br/>
        </form>
      `;

    new Dialog({
      title: `${game.i18n.localize('BITD.Roll')} ${game.i18n.localize(attribute_label)}`,
      content: content,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: game.i18n.localize('BITD.Roll'),
          callback: async (html) => {
            let modifier = parseInt(html.find('[name="mod"]')[0].value);
            let note = html.find('[name="note"]')[0].value;
            let action_dice_amount = this.getRollData().dice_amount[attribute_name] + modifier;
            let vice_dice_amount = this.getRollData().dice_amount['BITD.Vice'] + modifier;
            let stress = parseInt(this.system.stress.value);
            if (BladesHelpers.isAttributeAction(attribute_name)) {
              let input = html.find("input");
              for (let i = 0; i < input.length; i++){
                if (input[i].checked) {
                  switch (input[i].id) {
                    case 'actionRoll':
                      let position = html.find('[name="pos"]')[0].value;
                      let effect = html.find('[name="fx"]')[0].value;
                      await this.rollAttribute(attribute_name, modifier, position, effect, note);
                      break;
                    case 'fortune':
                      await bladesRoll(action_dice_amount,"BITD.Fortune","","",note,"");
                      break;
                    case 'gatherInfo':
                      await bladesRoll(action_dice_amount,"BITD.GatherInformation","","",note,"");
                      break;
                    case 'indulgeVice':
                      await bladesRoll(vice_dice_amount,"BITD.Vice","","",note,stress);
                      break;
                    case 'engagement':
                      let engagement_dice_amount = Number(html.find('[name="qty"]')[0].value);
                      await bladesRoll(engagement_dice_amount,"BITD.Engagement","","",note,"");
                      break;
                    case 'acqurieAsset':
                      let tier = html.find('[name="tier"]')[0].value;
                      let asset_dice_amount = parseInt(tier) + modifier;
                      await bladesRoll(asset_dice_amount,"BITD.AcquireAsset","","",note,"",tier);
                      break;                  
                    default:
                      await this.rollAttribute(attribute_name, modifier, position, effect, note);
                      break;
                  }
                break;
                }
              }
            } else {
                await this.rollAttribute(attribute_name, modifier,"","", note);
              }
          }
        },
        no: {
          icon: "<i class='fas fa-times'></i>",
          label: game.i18n.localize('Close'),
        },
      },
      default: "yes",
    }, { width: 460 }).render(true);

  }

  /* -------------------------------------------- */

  async rollAttribute(attribute_name = "", additional_dice_amount = 0, position, effect, note) {

    let dice_amount = 0;
    if (attribute_name !== "") {
      let roll_data = this.getRollData();
      dice_amount += roll_data.dice_amount[attribute_name];
    }
    else {
      dice_amount = 1;
    }
    dice_amount += additional_dice_amount;

    await bladesRoll(dice_amount, attribute_name, position, effect, note, this.system.stress.value);
  }

  /* -------------------------------------------- */

  /**
   * Create <options> for available actions
   *  which can be performed.
   */
  createListOfActions() {

    let text, attribute, skill;
    let attributes = this.system.attributes;

    for ( attribute in attributes ) {

      const skills = attributes[attribute].skills;

      text += `<optgroup label="${attribute} Actions">`;
      text += `<option value="${attribute}">${attribute} (Resist)</option>`;

      for ( skill in skills ) {
        text += `<option value="${skill}">${skill}</option>`;
      }

      text += `</optgroup>`;

    }

    return text;

  }

  /* -------------------------------------------- */

  /**
   * Creates <options> modifiers for dice roll.
   *
   * @param {int} rs
   *  Min die modifier
   * @param {int} re
   *  Max die modifier
   * @param {int} s
   *  Selected die
   */
  createListOfDiceMods(rs, re, s) {

    var text = ``;
    var i = 0;

    if ( s == "" ) {
      s = 0;
    }

    for ( i  = rs; i <= re; i++ ) {
      var plus = "";
      if ( i >= 0 ) { plus = "+" };
      text += `<option value="${i}"`;
      if ( i == s ) {
        text += ` selected`;
      }

      text += `>${plus}${i}d</option>`;
    }

    return text;

  }

  /* -------------------------------------------- */

}