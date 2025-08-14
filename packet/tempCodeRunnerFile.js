// 生成强制开机命令包
const forceOpenCommand = HONgenerateCommandPacket('forceOpen');
console.log('强制开机命令包:', forceOpenCommand);

// 生成强制关机命令包
const forceHaltCommand = HONgenerateCommandPacket('forceHalt');
console.log('强制关机命令包:', forceHaltCommand);

// 生成恢复正常命令包
const normalCommand = HONgenerateCommandPacket('normal');
console.log('恢复正常命令包:', normalCommand);

// 生成强制开机响应包
const forceOpenResponse = HONgenerateResponsePacket('forceOpen');
console.log('强制开机响应包:', forceOpenResponse);

// 生成强制关机响应包
const forceHaltResponse = HONgenerateResponsePacket('forceHalt');
console.log('强制关机响应包:', forceHaltResponse);

// 生成恢复正常响应包
const normalResponse = HONgenerateResponsePacket('normal');
console.log('恢复正常响应包:', normalResponse);

// 解析命令包
const commandPacket = Buffer.from('18025555', 'hex');
const parsedCommand = HONparseCommandPacket(commandPacket);
console.log('解析命令:', parsedCommand);

// 解析响应包
const responsePacket = Buffer.from('980155', 'hex');
const parsedResponse = HONparseResponsePacket(responsePacket);
console.log('解析响应:', parsedResponse);