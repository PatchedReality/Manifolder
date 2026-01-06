'use strict';

export const HEADER_SIZE = 16;

export const CONTROL = {
  REQUEST: 0,
  FIRE_FORGET: 1,
  RESPONSE: 2
};

let packetCounter = 0n;

export function createRequest(action, payload) {
  const payloadSize = payload ? payload.length : 0;
  const buffer = Buffer.alloc(HEADER_SIZE + payloadSize);

  writeTword(buffer, 0x00, packetCounter++);
  writeWord(buffer, 0x06, CONTROL.REQUEST);
  writeDword(buffer, 0x08, action);
  writeWord(buffer, 0x0C, payloadSize);
  writeWord(buffer, 0x0E, 0);

  if (payload && payloadSize > 0) {
    payload.copy(buffer, HEADER_SIZE);
  }

  return buffer;
}

export function parseResponse(buffer) {
  if (buffer.length < HEADER_SIZE) {
    throw new Error(`Buffer too small: expected at least ${HEADER_SIZE} bytes, got ${buffer.length}`);
  }

  const { value: packetIx } = readTword(buffer, 0x00);
  const { value: control } = readWord(buffer, 0x06);
  const { value: action } = readDword(buffer, 0x08);
  const { value: size } = readWord(buffer, 0x0C);

  const header = { packetIx, control, action, size };
  const payload = buffer.subarray(HEADER_SIZE, HEADER_SIZE + size);

  return { header, payload };
}

export function writeByte(buffer, offset, value) {
  buffer.writeUInt8(value, offset);
  return offset + 1;
}

export function writeWord(buffer, offset, value) {
  buffer.writeUInt16LE(value, offset);
  return offset + 2;
}

export function writeDword(buffer, offset, value) {
  buffer.writeUInt32LE(value, offset);
  return offset + 4;
}

export function writeTword(buffer, offset, value) {
  const bigValue = typeof value === 'bigint' ? value : BigInt(value);
  const low = Number(bigValue & 0xFFFFFFFFn);
  const high = Number((bigValue >> 32n) & 0xFFFFn);
  buffer.writeUInt32LE(low, offset);
  buffer.writeUInt16LE(high, offset + 4);
  return offset + 6;
}

export function writeQword(buffer, offset, value) {
  const bigValue = typeof value === 'bigint' ? value : BigInt(value);
  buffer.writeBigUInt64LE(bigValue, offset);
  return offset + 8;
}

export function writeDouble(buffer, offset, value) {
  buffer.writeDoubleLE(value, offset);
  return offset + 8;
}

export function writeStringW(buffer, offset, str) {
  const charCount = str.length;
  buffer.writeUInt16LE(charCount, offset);
  offset += 2;

  for (let i = 0; i < charCount; i++) {
    buffer.writeUInt16LE(str.charCodeAt(i), offset);
    offset += 2;
  }

  return offset;
}

export function readByte(buffer, offset) {
  const value = buffer.readUInt8(offset);
  return { value, newOffset: offset + 1 };
}

export function readWord(buffer, offset) {
  const value = buffer.readUInt16LE(offset);
  return { value, newOffset: offset + 2 };
}

export function readDword(buffer, offset) {
  const value = buffer.readUInt32LE(offset);
  return { value, newOffset: offset + 4 };
}

export function readTword(buffer, offset) {
  const low = buffer.readUInt32LE(offset);
  const high = buffer.readUInt16LE(offset + 4);
  const value = BigInt(low) | (BigInt(high) << 32n);
  return { value, newOffset: offset + 6 };
}

export function readQword(buffer, offset) {
  const value = buffer.readBigUInt64LE(offset);
  return { value, newOffset: offset + 8 };
}

export function readDouble(buffer, offset) {
  const value = buffer.readDoubleLE(offset);
  return { value, newOffset: offset + 8 };
}

export function readStringW(buffer, offset) {
  const charCount = buffer.readUInt16LE(offset);
  offset += 2;

  let str = '';
  for (let i = 0; i < charCount; i++) {
    str += String.fromCharCode(buffer.readUInt16LE(offset));
    offset += 2;
  }

  return { value: str, newOffset: offset };
}
