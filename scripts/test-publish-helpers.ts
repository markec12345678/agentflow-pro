/**
 * Local script to test publish helpers (formatForBooking, formatForAirbnb, generateHashtags)
 * Run: npm run test:helpers
 */
import {
  formatForBooking,
  formatForAirbnb,
  generateHashtags,
} from "../src/lib/tourism/publish-helpers";

const testContent = '<p>Test **bold** and *italic* content</p>';
console.log("formatForBooking:", formatForBooking(testContent));

const multiLine = "Para1\n\n\n\nPara2";
console.log("formatForAirbnb (collapse line breaks):", JSON.stringify(formatForAirbnb(multiLine)));

console.log("generateHashtags('Bela krajina', 'apartma'):", generateHashtags("Bela krajina", "apartma"));
