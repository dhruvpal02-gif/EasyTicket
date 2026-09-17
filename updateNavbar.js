const fs = require('fs');
let code = fs.readFileSync('client/src/components/Navbar.jsx', 'utf8');

const oldProfileBlock = 
                  <div className="flex items-center gap-3 pl-2">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-gray-900 leading-none">{user.name.split(' ')[0]}</span>
                      <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mt-1">{user.role}</span>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-inner">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <button 
;

const newProfileBlock = 
                  <div className="flex items-center gap-3 pl-2">
                    <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-gray-900 leading-none">{user.name.split(' ')[0]}</span>
                        <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mt-1">{user.role}</span>
                      </div>
                      <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-inner overflow-hidden">
                        {user.profilePicture ? <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                      </div>
                    </Link>
                    
                    <button 
;

code = code.replace(oldProfileBlock.trim(), newProfileBlock.trim());

const mobileOldProfileBlock = 
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-inner">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-base font-bold text-gray-900">{user.name}</div>
                      <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">{user.role}</div>
                    </div>
                  </div>
;

const mobileNewProfileBlock = 
                  <Link to="/profile" className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors" onClick={closeMenu}>
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-inner overflow-hidden">
                      {user.profilePicture ? <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-base font-bold text-gray-900">{user.name}</div>
                      <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">{user.role}</div>
                    </div>
                  </Link>
;

code = code.replace(mobileOldProfileBlock.trim(), mobileNewProfileBlock.trim());
fs.writeFileSync('client/src/components/Navbar.jsx', code, 'utf8');
