import React from 'react';

// Les composants (UserProfile, Avatar) devraient tester :
// -> support.class.component
// -> entity.name.function.component
const UserProfile = ({ user }: { user?: any }) => {
  
  // Le "?." (Optional Chaining) devrait tester :
  // -> punctuation.accessor.optional
  // -> keyword.operator.optional
  const avatarUrl = user?.profile?.avatar;

  // Le "??" (Null-coalescing) devrait tester :
  // -> keyword.operator.null-coalescing
  const displayName = user?.name ?? "Anonymous User";

  return (
    // Les chevrons "<", ">", "</" devraient tester :
    // -> punctuation.definition.tag.jsx/tsx
    // -> meta.tag.jsx/tsx
    <div className="user-profile">
      <Avatar src={avatarUrl} alt={displayName} />
      <span>{displayName}</span>
    </div>
  );
};

const Avatar = ({ src, alt }: { src?: string, alt: string }) => {
  const finalSrc = src ?? '/default-avatar.png';
  return <img src={finalSrc} alt={alt} />;
};

export default UserProfile;
