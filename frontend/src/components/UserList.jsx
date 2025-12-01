import React from 'react';

function UserList({ users, selectedUser, onSelectUser, loading, error }) {
  return (
    <div className="w-[300px] h-full flex flex-col bg-gray-100 border-r border-gray-200 flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 bg-blue-700 text-white">
        <h3 className="text-base font-semibold">Chat</h3>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-blue-700">Loading users...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : !users || users.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <p className="text-sm text-gray-600">No users available</p>
          <p className="text-xs text-gray-400 mt-1">
            Register another user to start chatting
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto py-0">
          {users.map((user, index) => {
            const isSelected = selectedUser?._id === user._id;

            return (
              <React.Fragment key={user._id}>
                <button
                  onClick={() => onSelectUser(user)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    isSelected
                      ? "bg-white hover:bg-blue-50"
                      : "bg-gray-100 hover:bg-blue-50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-semibold flex-shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                  </div>
                </button>

                {index < users.length - 1 && (
                  <div className="border-t border-gray-200"></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserList;
