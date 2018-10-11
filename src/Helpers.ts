export namespace Helpers {
  /**
   * Iterate through an array with async functions.
   * https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
   */
  export async function asyncForEach(array, callback) {
    if (!array) return;
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }

  /**
   * Shuffle an array the right way.
   * https://bost.ocks.org/mike/shuffle/
   */
  export function shuffle<T>(array: Array<T>): Array<T> {
    var m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {
      // Pick a remaining element…
      i = Math.floor(Math.random() * m--);

      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }

    return array;
  }

  /**
   * Normalize text:
   * - Normalize Unicode chars
   * - Remove accents
   * - Remove punctuation
   * - Normalize spaces
   * - Lowercase
   */
  export function normalize(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

}
