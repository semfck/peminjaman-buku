create table peminjaman (
  id uuid primary key default uuid_generate_v4(),
  nama text,
  no_hp text,
  judul_buku text,
  tanggal_pinjam date,
  lama_pinjam int,
  tanggal_kembali date,
  denda numeric
);
