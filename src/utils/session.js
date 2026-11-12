export const savePasswordAndRevokeRefreshToken = async (user, newPassword) => {
  user.password = newPassword;
  user.refreshToken = undefined;

  // The undefined assignment is persisted by Mongoose as an unset field.
  // Without the stored refresh token, refreshAccessToken rejects old sessions.
  await user.save({ validateBeforeSave: false });
};
